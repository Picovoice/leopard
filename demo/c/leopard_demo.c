/*
    Copyright 2019-2022 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

#if !(defined(_WIN32) || defined(_WIN64))

#include <dlfcn.h>

#endif

#include <getopt.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/time.h>

#if defined(_WIN32) || defined(_WIN64)

#include <windows.h>

#endif

#include "pv_leopard.h"

static void *open_dl(const char *dl_path) {

#if defined(_WIN32) || defined(_WIN64)

    return LoadLibrary(dl_path);

#else

    return dlopen(dl_path, RTLD_NOW);

#endif

}

static void *load_symbol(void *handle, const char *symbol) {

#if defined(_WIN32) || defined(_WIN64)

    return GetProcAddress((HMODULE) handle, symbol);

#else

    return dlsym(handle, symbol);

#endif

}

static void close_dl(void *handle) {

#if defined(_WIN32) || defined(_WIN64)

    FreeLibrary((HMODULE) handle);

#else

    dlclose(handle);

#endif

}

static void print_dl_error(const char *message) {

#if defined(_WIN32) || defined(_WIN64)

    fprintf(stderr, "%s with code `%lu`.\n", message, GetLastError());

#else

    fprintf(stderr, "%s with `%s`.\n", message, dlerror());

#endif

}

int main(int argc, char **argv) {
    const char *access_key = NULL;
    const char *library_path = NULL;
    const char *model_path = NULL;

    int opt;
    while ((opt = getopt(argc, argv, "a:l:m:")) != -1) {
        switch (opt) {
            case 'a':
                access_key = optarg;
                break;
            case 'l':
                library_path = optarg;
                break;
            case 'm':
                model_path = optarg;
                break;
            default:
                break;
        }
    }

    if (!(access_key && library_path && model_path && (optind < argc))) {
        fprintf(stderr, "-a ACCESS_KEY -l LIBRARY_PATH -m MODEL_PATH wav_path0 wav_path1 ...\n");
        exit(1);
    }

    void *dl_handle = open_dl(library_path);
    if (!dl_handle) {
        fprintf(stderr, "failed to load library at `%s`.\n", library_path);
        exit(1);
    }

    const char *(*pv_status_to_string)(pv_status_t) = load_symbol(dl_handle, "pv_status_to_string");
    if (!pv_status_to_string) {
        print_dl_error("failed to load `pv_status_to_string`");
        exit(1);
    }

    pv_status_t (*pv_leopard_init)(const char *, const char *, pv_leopard_t **) =
    load_symbol(dl_handle, "pv_leopard_init");
    if (!pv_leopard_init) {
        print_dl_error("failed to load `pv_leopard_init`");
        exit(1);
    }

    void (*pv_leopard_delete)(pv_leopard_t *) = load_symbol(dl_handle, "pv_leopard_delete");
    if (!pv_leopard_delete) {
        print_dl_error("failed to load `pv_leopard_delete`");
        exit(1);
    }

    pv_status_t (*pv_leopard_process)(pv_leopard_t *, const int16_t *, int32_t, char **) =
    load_symbol(dl_handle, "pv_leopard_process");
    if (!pv_leopard_process) {
        print_dl_error("failed to load `pv_leopard_process`");
        exit(1);
    }

    struct timeval before;
    gettimeofday(&before, NULL);

    pv_leopard_t *leopard = NULL;
    pv_status_t status = pv_leopard_init(access_key, model_path, &leopard);
    if (status != PV_STATUS_SUCCESS) {
        fprintf(stderr, "failed to init with `%s`.\n", pv_status_to_string(status));
        exit(1);
    }

    struct timeval after;
    gettimeofday(&after, NULL);

    double init_time_sec =
            ((double) (after.tv_sec - before.tv_sec) + ((double) (after.tv_usec - before.tv_usec)) * 1e-6);
    fprintf(stdout, "init took %.1f sec\n", init_time_sec);

    for (int32_t i = optind; i < argc; i++) {
        FILE *wav_handle = fopen(argv[i], "rb");
        if (!wav_handle) {
            fprintf(stderr, "failed to open wav file at `%s`.\n", argv[i]);
            exit(1);
        }

        static const int32_t WAV_HEADER_LENGTH_BYTE = 44;

        fseek(wav_handle, 0, SEEK_END);
        const int32_t pcm_length_byte = (int32_t) ftell(wav_handle) - WAV_HEADER_LENGTH_BYTE;
        const int32_t num_samples = pcm_length_byte / (int32_t) sizeof(int16_t);
        fseek(wav_handle, WAV_HEADER_LENGTH_BYTE, SEEK_SET);

        int16_t *pcm = malloc(pcm_length_byte);
        if (!pcm) {
            fprintf(stderr, "failed to allocate memory for audio buffer\n");
            exit(1);
        }

        const size_t count = fread(pcm, sizeof(int16_t), num_samples, wav_handle);
        if (count != (size_t) num_samples) {
            fprintf(stderr, "failed to read audio data from `%s`", argv[i]);
            exit(1);
        }

        char *transcript = NULL;
        status = pv_leopard_process(leopard, pcm, num_samples, &transcript);
        if (status != PV_STATUS_SUCCESS) {
            fprintf(stderr, "failed to process with `%s`.\n", pv_status_to_string(status));
            exit(1);
        }

        fprintf(stdout, "%s\n", transcript);
        free(pcm);
        free(transcript);
    }

    pv_leopard_delete(leopard);
    close_dl(dl_handle);

    return 0;
}
