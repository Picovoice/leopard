//
// Copyright 2022 Picovoice Inc.
//
// You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
// file accompanying this source.
//
// Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
// an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.
//

package ai.picovoice.flutter.leopard;

import android.content.Context;

import androidx.annotation.NonNull;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import ai.picovoice.leopard.*;
import io.flutter.embedding.engine.plugins.FlutterPlugin;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;
import io.flutter.plugin.common.MethodChannel.MethodCallHandler;
import io.flutter.plugin.common.MethodChannel.Result;

public class LeopardPlugin implements FlutterPlugin, MethodCallHandler {

  private enum Method {
    CREATE,
    PROCESS,
    PROCESSFILE,
    DELETE
  }

  private Context flutterContext;
  private MethodChannel channel;
  private final Map<String, Leopard> leopardPool = new HashMap<>();

  @Override
  public void onAttachedToEngine(@NonNull FlutterPluginBinding flutterPluginBinding) {
    flutterContext = flutterPluginBinding.getApplicationContext();
    channel = new MethodChannel(flutterPluginBinding.getBinaryMessenger(), "leopard");
    channel.setMethodCallHandler(this);
  }

  @Override
  public void onMethodCall(@NonNull MethodCall call, @NonNull Result result) {
    Method method;
    try {
      method = Method.valueOf(call.method.toUpperCase());
    } catch (IllegalArgumentException e) {
      result.error(
              LeopardRuntimeException.class.getSimpleName(),
              String.format("Leopard method '%s' is not a valid function", call.method),
              null);
      return;
    }

    switch (method) {
      case CREATE:
        try {
          String accessKey = call.argument("accessKey");
          String modelPath = call.argument("modelPath");

          Leopard.Builder leopardBuilder = new Leopard.Builder(accessKey).setModelPath(modelPath);

          Leopard leopard = leopardBuilder.build(flutterContext);
          leopardPool.put(String.valueOf(System.identityHashCode(leopard)), leopard);

          Map<String, Object> param = new HashMap<>();
          param.put("handle", String.valueOf(System.identityHashCode(leopard)));
          param.put("sampleRate", leopard.getSampleRate());
          param.put("version", leopard.getVersion());

          result.success(param);
        } catch (LeopardException e) {
          result.error(e.getClass().getSimpleName(), e.getMessage(), null);
        } catch (Exception e) {
          result.error(LeopardException.class.getSimpleName(), e.getMessage(), null);
        }
        break;
      case PROCESS:
        try {
          String handle = call.argument("handle");
          ArrayList<Integer> pcmList = call.argument("frame");

          if (!leopardPool.containsKey(handle)) {
            result.error(
                    LeopardInvalidStateException.class.getSimpleName(),
                    "Invalid leopard handle provided to native module",
                    null);
            return;
          }

          short[] pcm = null;
          if (pcmList != null) {
            pcm = new short[pcmList.size()];
            for (int i = 0; i < pcmList.size(); i++) {
              pcm[i] = pcmList.get(i).shortValue();
            }
          }

          Leopard leopard = leopardPool.get(handle);
          String transcript = leopard.process(pcm);

          Map<String, Object> param = new HashMap<>();
          param.put("transcript", transcript);

          result.success(param);
        } catch (LeopardException e) {
          result.error(
                  e.getClass().getSimpleName(),
                  e.getMessage(),
                  null);
        }
        break;
      case PROCESSFILE:
        try {
          String handle = call.argument("handle");
          String path = call.argument("path");

          if (!leopardPool.containsKey(handle)) {
            result.error(
                    LeopardInvalidStateException.class.getSimpleName(),
                    "Invalid leopard handle provided to native module",
                    null);
            return;
          }

          Leopard leopard = leopardPool.get(handle);
          String transcript = leopard.processFile(path);

          Map<String, Object> param = new HashMap<>();
          param.put("transcript", transcript);

          result.success(param);
        } catch (LeopardException e) {
          result.error(
                  e.getClass().getSimpleName(),
                  e.getMessage(),
                  null);
        }
        break;
      case DELETE:
        String handle = call.argument("handle");

        if (!leopardPool.containsKey(handle)) {
          result.error(
                  LeopardInvalidArgumentException.class.getSimpleName(),
                  "Invalid Leopard handle provided to native module.",
                  null);
          return;
        }

        Leopard leopard = leopardPool.get(handle);
        leopard.delete();
        leopardPool.remove(handle);

        result.success(null);
        break;
    }
  }

  @Override
  public void onDetachedFromEngine(@NonNull FlutterPluginBinding binding) {
    channel.setMethodCallHandler(null);
  }
}
