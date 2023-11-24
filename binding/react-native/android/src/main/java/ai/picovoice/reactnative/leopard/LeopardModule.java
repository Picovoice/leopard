/*
Copyright 2022-2023 Picovoice Inc.

You may not use this file except in compliance with the license. A copy of the license is
located in the "LICENSE" file accompanying this source.

Unless required by applicable law or agreed to in writing, software distributed under the
License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing permissions and
limitations under the License.
*/

package ai.picovoice.reactnative.leopard;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import ai.picovoice.leopard.Leopard;
import ai.picovoice.leopard.LeopardException;
import ai.picovoice.leopard.LeopardInvalidStateException;
import ai.picovoice.leopard.LeopardTranscript;

public class LeopardModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private final Map<String, Leopard> leopardPool = new HashMap<>();

    public LeopardModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        Leopard.setSdk("react-native");
    }

    @Override
    public String getName() {
        return "PvLeopard";
    }

    @ReactMethod
    public void create(
            String accessKey,
            String modelPath,
            boolean enableAutomaticPunctuation,
            boolean enableDiarization,
            Promise promise) {
        try {

            Leopard leopard = new Leopard.Builder()
                    .setAccessKey(accessKey)
                    .setModelPath(modelPath.isEmpty() ? null : modelPath)
                    .setEnableAutomaticPunctuation(enableAutomaticPunctuation)
                    .setEnableDiarization(enableDiarization)
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
            Leopard leopard = leopardPool.get(handle);
            if (leopard != null) {
                leopard.delete();
            }
            leopardPool.remove(handle);
        }
    }

    @ReactMethod
    public void process(String handle, ReadableArray pcmArray, Promise promise) {

        if (!leopardPool.containsKey(handle)) {
            promise.reject(LeopardInvalidStateException.class.getSimpleName(),
                    "Invalid Leopard handle provided to native module.");
            return;
        }

        ArrayList<Object> pcmArrayList = pcmArray.toArrayList();
        short[] buffer = new short[pcmArray.size()];
        for (int i = 0; i < pcmArray.size(); i++) {
            buffer[i] = ((Number) pcmArrayList.get(i)).shortValue();
        }

        Leopard leopard = leopardPool.get(handle);
        if (leopard == null) {
            promise.reject(LeopardInvalidStateException.class.getSimpleName(),
                    "Instance of Leopard no longer exists.");
            return;
        }

        try {
            LeopardTranscript result = leopard.process(buffer);
            promise.resolve(leopardTranscriptToWriteableMap(result));
        } catch (LeopardException e) {
            promise.reject(e.getClass().getSimpleName(), e.getMessage());
        }
    }

    @ReactMethod
    public void processFile(String handle, String audioPath, Promise promise) {

        if (!leopardPool.containsKey(handle)) {
            promise.reject(LeopardInvalidStateException.class.getSimpleName(),
                    "Invalid Leopard handle provided to native module.");
            return;
        }

        Leopard leopard = leopardPool.get(handle);
        if (leopard == null) {
            promise.reject(LeopardInvalidStateException.class.getSimpleName(),
                    "Instance of Leopard no longer exists.");
            return;
        }

        try {
            LeopardTranscript result = leopard.processFile(audioPath);
            promise.resolve(leopardTranscriptToWriteableMap(result));
        } catch (LeopardException e) {
            promise.reject(e.getClass().getSimpleName(), e.getMessage());
        }
    }

    private WritableMap leopardTranscriptToWriteableMap(LeopardTranscript result) {
        WritableMap resultMap = Arguments.createMap();
        resultMap.putString("transcript", result.getTranscriptString());

        WritableArray words = Arguments.createArray();
        for (LeopardTranscript.Word word : result.getWordArray()) {
            WritableMap wordMap = Arguments.createMap();
            wordMap.putString("word", word.getWord());
            wordMap.putDouble("confidence", word.getConfidence());
            wordMap.putDouble("startSec", word.getStartSec());
            wordMap.putDouble("endSec", word.getEndSec());
            wordMap.putInt("speakerTag", word.getSpeakerTag());
            words.pushMap(wordMap);
        }
        resultMap.putArray("words", words);

        return resultMap;
    }
}
