/*
    Copyright 2019 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>

#include "pv_leopard.h"

int main(int argc, char **argv) {
    if (argc < 6) {
        fprintf(
                stderr,
                "usage: %s dynamic_library_path acoustic_model_path language_model_path audio_file_path\n",
                argv[0]);
        exit(1);
    }

    const char *library_path = argv[1];

    void *dl_handle = dlopen(library_path, RTLD_NOW);
    if (!dl_handle) {
        fprintf(stderr, "failed to load dynamic library at '%s'.\n", library_path);
        exit(1);
    }

    char *error;

    const char *(*pv_status_to_string)(pv_status_t) = dlsym(dl_handle, "pv_status_to_string");
    if ((error = dlerror()) != NULL) {
        fprintf(stderr, "failed to load 'pv_status_to_string' with '%s'.\n", error);
        exit(1);
    }

    pv_status_t (*pv_leopard_init)(const char *, const char *, const char *, pv_leopard_t **) =
    dlsym(dl_handle, "pv_leopard_init");
    if ((error = dlerror()) != NULL) {
        fprintf(stderr, "failed to load 'pv_leopard_init' with '%s'.\n", error);
        exit(1);
    }

    void (*pv_leopard_delete)(pv_leopard_t *) = dlsym(dl_handle, "pv_leopard_delete");
    if ((error = dlerror()) != NULL) {
        fprintf(stderr, "failed to load 'pv_leopard_delete' with '%s'.\n", error);
        exit(1);
    }

    pv_status_t (*pv_leopard_process)(pv_leopard_t *, const int16_t *, int32_t, char **) =
    dlsym(dl_handle, "pv_leopard_process");
    if ((error = dlerror()) != NULL) {
        fprintf(stderr, "failed to load 'pv_leopard_process' with '%s'.\n", error);
        exit(1);
    }

    const char *acoustic_model_path = argv[2];
    const char *language_model_path = argv[3];
    const char *license_path = argv[4];

    pv_leopard_t *leopard;
    pv_status_t status = pv_leopard_init(acoustic_model_path, language_model_path, license_path, &leopard);
    if (status != PV_STATUS_SUCCESS) {
        fprintf(stderr, "failed to init with '%s'.\n", pv_status_to_string(status));
        exit(1);
    }

    const char *wav_path = argv[5];
    FILE *wav_handle = fopen(wav_path, "rb");
    if (!wav_handle) {
        fprintf(stderr, "failed to open wav file located at '%s'.\n", wav_path);
        exit(1);
    }

    static const int32_t WAV_HEADER_LENGTH_BYTE = 44;

    fseek(wav_handle, 0, SEEK_END);
    const int32_t pcm_length_byte = ftell(wav_handle) - WAV_HEADER_LENGTH_BYTE;
    const int32_t num_samples = pcm_length_byte / sizeof(int16_t);
    fseek(wav_handle, WAV_HEADER_LENGTH_BYTE, SEEK_SET);

    int16_t *pcm = malloc(pcm_length_byte);
    if (!pcm) {
        fprintf(stderr, "failed to allocate memory for audio buffer\n");
        exit(1);
    }

    const size_t count = fread(pcm, sizeof(int16_t), num_samples, wav_handle);
    if (count != (size_t) num_samples) {
        fprintf(stderr, "failed to read audio data from '%s'", wav_path);
        exit(1);
    }

    char *transcript;
    status = pv_leopard_process(leopard, pcm, num_samples, &transcript);
    if (status != PV_STATUS_SUCCESS) {
        fprintf(stderr, "failed to process with '%s'.\n", pv_status_to_string(status));
        exit(1);
    }

    fprintf(stdout, "%s\n", transcript);
    fflush(stdout);

    pv_leopard_delete(leopard);

    return 0;
}
