/*
    Copyright 2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is
    located in the "LICENSE" file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the
    License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
    express or implied. See the License for the specific language governing permissions and
    limitations under the License.
*/

package ai.picovoice.reactnative.leopard;

import ai.picovoice.leopard.*;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;


public class LeopardModule extends ReactContextBaseJavaModule {

  private static final String LOG_TAG = "PvLeopard";
  private final ReactApplicationContext reactContext;
  private final Map<String, Leopard> leopardPool = new HashMap<>();

  public LeopardModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return "PvLeopard";
  }

  @ReactMethod
  public void create(String accessKey, String modelPath, Promise promise) {
    try {
      Leopard leopard = new Leopard.Builder().setAccessKey(accessKey)
              .setModelPath(modelPath.isEmpty() ? null : modelPath)
              .build(reactContext);
      leopardPool.put(String.valueOf(System.identityHashCode(leopard)), leopard);

      WritableMap paramMap = Arguments.createMap();
      paramMap.putString("handle", String.valueOf(System.identityHashCode(leopard)));
      paramMap.putInt("sampleRate", leopard.getSampleRate());
      paramMap.putString("version", leopard.getVersion());
      promise.resolve(paramMap);
    } catch (LeopardException e) {
      promise.reject(e.getClass().getSimpleName(), e.getMessage());
    }
  }

  @ReactMethod
  public void delete(String handle) {
    if (leopardPool.containsKey(handle)) {
      leopardPool.get(handle).delete();
      leopardPool.remove(handle);
    }
  }

  @ReactMethod
  public void process(String handle, ReadableArray pcmArray, Promise promise) {
    try {
      if (!leopardPool.containsKey(handle)) {
        promise.reject(LeopardInvalidStateException.class.getSimpleName(), "Invalid Leopard handle provided to native module.");
        return;
      }

      Leopard leopard = leopardPool.get(handle);
      ArrayList<Object> pcmArrayList = pcmArray.toArrayList();
      short[] buffer = new short[pcmArray.size()];
      for (int i = 0; i < pcmArray.size(); i++) {
        buffer[i] = ((Number) pcmArrayList.get(i)).shortValue();
      }
      String result = leopard.process(buffer);
      promise.resolve(result);
    } catch (LeopardException e) {
      promise.reject(e.getClass().getSimpleName(), e.getMessage());
    }
  }

  @ReactMethod
  public void processFile(String handle, String audioPath, Promise promise) {
    try {
      if (!leopardPool.containsKey(handle)) {
        promise.reject(LeopardInvalidStateException.class.getSimpleName(), "Invalid Leopard handle provided to native module.");
        return;
      }

      Leopard leopard = leopardPool.get(handle);
      String result = leopard.processFile(audioPath);
      promise.resolve(result);
    } catch (LeopardException e) {
      promise.reject(e.getClass().getSimpleName(), e.getMessage());
    }
  }
}
