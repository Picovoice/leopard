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
#include <stdbool.h>
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

int picovoice_main(int argc, char **argv) {
    const char *access_key = NULL;
    const char *model_path = NULL;
    const char *library_path = NULL;
    bool enable_automatic_punctuation = true;
    bool show_metadata = false;

    int opt;
    while ((opt = getopt(argc, argv, "a:m:l:dv")) != -1) {
        switch (opt) {
            case 'a':
                access_key = optarg;
                break;
            case 'm':
                model_path = optarg;
                break;
            case 'l':
                library_path = optarg;
                break;
            case 'd':
                enable_automatic_punctuation = false;
                break;
            case 'v':
                show_metadata = true;
                break;
            default:
                break;
        }
    }

    if (!(access_key && library_path && model_path && (optind < argc))) {
        fprintf(stderr, "usage: -a ACCESS_KEY -m MODEL_PATH -l LIBRARY_PATH [-d] [-v] audio_path0 audio_path1 ...\n");
        exit(1);
    }

    void *dl_handle = open_dl(library_path);
    if (!dl_handle) {
        fprintf(stderr, "failed to load library at `%s`.\n", library_path);
        exit(1);
    }

    const char *(*pv_status_to_string_func)(pv_status_t) = load_symbol(dl_handle, "pv_status_to_string");
    if (!pv_status_to_string_func) {
        print_dl_error("failed to load `pv_status_to_string`");
        exit(1);
    }

    const int32_t (*pv_sample_rate_func)() = load_symbol(dl_handle, "pv_sample_rate");
    if (!pv_sample_rate_func) {
        print_dl_error("failed to load `pv_sample_rate`");
        exit(1);
    }

    pv_status_t (*pv_leopard_init_func)(const char *, const char *, bool, pv_leopard_t **) =
    load_symbol(dl_handle, "pv_leopard_init");
    if (!pv_leopard_init_func) {
        print_dl_error("failed to load `pv_leopard_init`");
        exit(1);
    }

    void (*pv_leopard_delete_func)(pv_leopard_t *) = load_symbol(dl_handle, "pv_leopard_delete");
    if (!pv_leopard_delete_func) {
        print_dl_error("failed to load `pv_leopard_delete`");
        exit(1);
    }

    pv_status_t (*pv_leopard_process_file_func)(pv_leopard_t *, const char *, char **, int32_t *, pv_word_t **) =
    load_symbol(dl_handle, "pv_leopard_process_file");
    if (!pv_leopard_process_file_func) {
        print_dl_error("failed to load `pv_leopard_process_file`");
        exit(1);
    }

    struct timeval before;
    gettimeofday(&before, NULL);

    pv_leopard_t *leopard = NULL;
    pv_status_t status = pv_leopard_init_func(access_key, model_path, enable_automatic_punctuation, &leopard);
    if (status != PV_STATUS_SUCCESS) {
        fprintf(stderr, "failed to init with `%s`.\n", pv_status_to_string_func(status));
        exit(1);
    }

    struct timeval after;
    gettimeofday(&after, NULL);

    double init_sec = ((double) (after.tv_sec - before.tv_sec) + ((double) (after.tv_usec - before.tv_usec)) * 1e-6);
    fprintf(stdout, "init took %.1f sec\n", init_sec);

    double proc_sec = 0.;

    for (int32_t i = optind; i < argc; i++) {
        gettimeofday(&before, NULL);

        char *transcript = NULL;
        int32_t num_words = 0;
        pv_word_t *words = NULL;
        status = pv_leopard_process_file_func(leopard, argv[i], &transcript, &num_words, &words);
        if (status != PV_STATUS_SUCCESS) {
            fprintf(stderr, "failed to process with `%s`.\n", pv_status_to_string_func(status));
            exit(1);
        }

        gettimeofday(&after, NULL);

        proc_sec += ((double) (after.tv_sec - before.tv_sec) + ((double) (after.tv_usec - before.tv_usec)) * 1e-6);

        fprintf(stdout, "%s\n", transcript);
        free(transcript);

        if (show_metadata) {
            for (int32_t j = 0; j < num_words; j++) {
                fprintf(
                        stdout,
                        "[%s]\t.start_sec = %.1f .end_sec = %.1f .confidence = %.2f\n",
                        words[j].word,
                        words[j].start_sec,
                        words[j].end_sec,
                        words[j].confidence);
            }
            printf("\n");
        }
        free(words);
    }

    fprintf(stdout, "proc took %.2f sec\n", proc_sec);

    pv_leopard_delete_func(leopard);
    close_dl(dl_handle);

    return 0;
}

int main(int argc, char *argv[]) {

#if defined(_WIN32) || defined(_WIN64)

#define UTF8_COMPOSITION_FLAG (0)
#define NULL_TERMINATED (-1)

    LPWSTR *wargv = CommandLineToArgvW(GetCommandLineW(), &argc);
    if (wargv == NULL) {
        fprintf(stderr, "CommandLineToArgvW failed\n");
        exit(1);
    }

    char *utf8_argv[argc];

    for (int i = 0; i < argc; ++i) {
        // WideCharToMultiByte: https://docs.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-widechartomultibyte
        int arg_chars_num = WideCharToMultiByte(CP_UTF8, UTF8_COMPOSITION_FLAG, wargv[i], NULL_TERMINATED, NULL, 0, NULL, NULL);
        utf8_argv[i] = (char *) malloc(arg_chars_num * sizeof(char));
        if (!utf8_argv[i]) {
            fprintf(stderr, "failed to to allocate memory for converting args");
        }
        WideCharToMultiByte(CP_UTF8, UTF8_COMPOSITION_FLAG, wargv[i], NULL_TERMINATED, utf8_argv[i], arg_chars_num, NULL, NULL);
    }

    LocalFree(wargv);
    argv = utf8_argv;

#endif

    int result = picovoice_main(argc, argv);

#if defined(_WIN32) || defined(_WIN64)

    for (int i = 0; i < argc; ++i) {
        free(utf8_argv[i]);
    }

#endif

    return result;
}
