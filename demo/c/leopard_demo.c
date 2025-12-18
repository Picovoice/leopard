/*
    Copyright 2019-2025 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of
   the license is located in the "LICENSE" file accompanying this source.

    Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
   WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
   License for the specific language governing permissions and limitations under
   the License.
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

    return GetProcAddress((HMODULE)handle, symbol);

#else

    return dlsym(handle, symbol);

#endif
}

static void close_dl(void *handle) {

#if defined(_WIN32) || defined(_WIN64)

    FreeLibrary((HMODULE)handle);

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

static void print_usage(const char *program_name) {
    fprintf(
            stdout,
            "Usage: %s  -l LIBRARY_PATH [-a ACCESS_KEY -m MODEL_PATH -y DEVICE -d -p -v] audio_path0 audio_path1 ...\n"
            "           -d: disable speaker diarization\n"
            "           -p: disable automatic punctuation\n"
            "           -v: enable verbose output (i.e. print word metadata)\n"
            "        %s [-z] -l LIBRARY_PATH\n",
            program_name,
            program_name);
}

void print_error_message(char **message_stack, int32_t message_stack_depth) {
    for (int32_t i = 0; i < message_stack_depth; i++) {
        fprintf(stderr, "  [%d] %s\n", i, message_stack[i]);
    }
}

static void print_inference_devices(const char *library_path) {
    void *dl_handle = open_dl(library_path);
    if (!dl_handle) {
        fprintf(stderr, "Failed to open library at '%s'.\n", library_path);
        exit(EXIT_FAILURE);
    }

    const char *(*pv_status_to_string_func)(pv_status_t) = load_symbol(dl_handle, "pv_status_to_string");
    if (!pv_status_to_string_func) {
        print_dl_error("Failed to load 'pv_status_to_string'");
        exit(EXIT_FAILURE);
    }

    pv_status_t (*pv_leopard_list_hardware_devices_func)(char ***, int32_t *) =
    load_symbol(dl_handle, "pv_leopard_list_hardware_devices");
    if (!pv_leopard_list_hardware_devices_func) {
        print_dl_error("failed to load `pv_leopard_list_hardware_devices`");
        exit(EXIT_FAILURE);
    }

    pv_status_t (*pv_leopard_free_hardware_devices_func)(char **, int32_t) =
        load_symbol(dl_handle, "pv_leopard_free_hardware_devices");
    if (!pv_leopard_free_hardware_devices_func) {
        print_dl_error("failed to load `pv_leopard_free_hardware_devices`");
        exit(EXIT_FAILURE);
    }

    pv_status_t (*pv_get_error_stack_func)(char ***, int32_t *) =
        load_symbol(dl_handle, "pv_get_error_stack");
    if (!pv_get_error_stack_func) {
        print_dl_error("failed to load 'pv_get_error_stack_func'");
        exit(EXIT_FAILURE);
    }

    void (*pv_free_error_stack_func)(char **) =
        load_symbol(dl_handle, "pv_free_error_stack");
    if (!pv_free_error_stack_func) {
        print_dl_error("failed to load 'pv_free_error_stack_func'");
        exit(EXIT_FAILURE);
    }

    char **message_stack = NULL;
    int32_t message_stack_depth = 0;
    pv_status_t error_status = PV_STATUS_RUNTIME_ERROR;

    char **hardware_devices = NULL;
    int32_t num_hardware_devices = 0;
    pv_status_t status = pv_leopard_list_hardware_devices_func(&hardware_devices, &num_hardware_devices);
    if (status != PV_STATUS_SUCCESS) {
        fprintf(
                stderr,
                "Failed to list hardware devices with `%s`.\n",
                pv_status_to_string_func(status));
        error_status = pv_get_error_stack_func(&message_stack, &message_stack_depth);
        if (error_status != PV_STATUS_SUCCESS) {
            fprintf(
                    stderr,
                    ".\nUnable to get leopard error state with '%s'.\n",
                    pv_status_to_string_func(error_status));
            exit(EXIT_FAILURE);
        }

        if (message_stack_depth > 0) {
            fprintf(stderr, ":\n");
            print_error_message(message_stack, message_stack_depth);
            pv_free_error_stack_func(message_stack);
        }
        exit(EXIT_FAILURE);
    }

    for (int32_t i = 0; i < num_hardware_devices; i++) {
        fprintf(stdout, "%s\n", hardware_devices[i]);
    }
    pv_leopard_free_hardware_devices_func(hardware_devices, num_hardware_devices);
    close_dl(dl_handle);
}

int picovoice_main(int argc, char **argv) {
    const char *access_key = NULL;
    const char *model_path = NULL;
    const char *device = NULL;
    const char *library_path = NULL;
    bool enable_automatic_punctuation = true;
    bool enable_diarization = true;
    bool show_metadata = false;
    bool show_inference_devices = false;

    int opt;
    while ((opt = getopt(argc, argv, "za:m:y:l:pdv")) != -1) {
        switch (opt) {
            case 'a':
                access_key = optarg;
                break;
            case 'm':
                model_path = optarg;
                break;
            case 'y':
                device = optarg;
                break;
            case 'l':
                library_path = optarg;
                break;
            case 'p':
                enable_automatic_punctuation = false;
                break;
            case 'd':
                enable_diarization = false;
                break;
            case 'v':
                show_metadata = true;
                break;
            case 'z':
                show_inference_devices = true;
                break;
            default:
                break;
        }
    }

    if (show_inference_devices) {
        if (!library_path) {
            fprintf(stderr, "`library_path` is required to view available inference devices.\n");
            print_usage(argv[0]);
            exit(EXIT_FAILURE);
        }

        print_inference_devices(library_path);
        return EXIT_SUCCESS;
    }

    if (!(access_key && library_path && model_path && (optind < argc))) {
        print_usage(argv[0]);
        exit(1);
    }

    void *dl_handle = open_dl(library_path);
    if (!dl_handle) {
        fprintf(stderr, "failed to load library at `%s`.\n", library_path);
        exit(1);
    }

    const char *(*pv_status_to_string_func)(pv_status_t) =
    load_symbol(dl_handle, "pv_status_to_string");
    if (!pv_status_to_string_func) {
        print_dl_error("failed to load `pv_status_to_string`");
        exit(1);
    }

    const int32_t (*pv_sample_rate_func)() =
    load_symbol(dl_handle, "pv_sample_rate");
    if (!pv_sample_rate_func) {
        print_dl_error("failed to load `pv_sample_rate`");
        exit(1);
    }

    pv_status_t (*pv_leopard_init_func)(
            const char *,
            const char *,
            const char *,
            bool,
            bool,
            pv_leopard_t **) = load_symbol(dl_handle, "pv_leopard_init");
    if (!pv_leopard_init_func) {
        print_dl_error("failed to load `pv_leopard_init`");
        exit(1);
    }

    void (*pv_leopard_delete_func)(pv_leopard_t *) = load_symbol(dl_handle, "pv_leopard_delete");
    if (!pv_leopard_delete_func) {
        print_dl_error("failed to load `pv_leopard_delete`");
        exit(1);
    }

    pv_status_t (*pv_leopard_process_file_func)(
            pv_leopard_t *,
            const char *,
            char **,
            int32_t *,
            pv_word_t **) = load_symbol(dl_handle, "pv_leopard_process_file");
    if (!pv_leopard_process_file_func) {
        print_dl_error("failed to load `pv_leopard_process_file`");
        exit(1);
    }

    pv_status_t (*pv_leopard_transcript_delete_func)(char *) =
            load_symbol(dl_handle, "pv_leopard_transcript_delete");
    if (!pv_leopard_transcript_delete_func) {
        print_dl_error("failed to load `pv_leopard_transcript_delete`");
        exit(1);
    }

    pv_status_t (*pv_leopard_words_delete_func)(pv_word_t *) =
            load_symbol(dl_handle, "pv_leopard_words_delete");
    if (!pv_leopard_words_delete_func) {
        print_dl_error("failed to load `pv_leopard_words_delete`");
        exit(1);
    }

    pv_status_t (*pv_get_error_stack_func)(
            char ***,
            int32_t *) = load_symbol(dl_handle, "pv_get_error_stack");
    if (!pv_get_error_stack_func) {
        print_dl_error("failed to load 'pv_get_error_stack_func'");
        exit(1);
    }

    void (*pv_free_error_stack_func)(char **) =
            load_symbol(dl_handle, "pv_free_error_stack");
    if (!pv_free_error_stack_func) {
        print_dl_error("failed to load 'pv_free_error_stack_func'");
        exit(1);
    }
    struct timeval before;
    gettimeofday(&before, NULL);

    char **message_stack = NULL;
    int32_t message_stack_depth = 0;
    pv_status_t error_status = PV_STATUS_RUNTIME_ERROR;

    pv_leopard_t *leopard = NULL;
    pv_status_t status = pv_leopard_init_func(
            access_key,
            model_path,
            device,
            enable_automatic_punctuation,
            enable_diarization,
            &leopard);
    if (status != PV_STATUS_SUCCESS) {
        fprintf(
                stderr,
                "Failed to init with `%s`",
                pv_status_to_string_func(status));
        error_status = pv_get_error_stack_func(&message_stack, &message_stack_depth);
        if (error_status != PV_STATUS_SUCCESS) {
            fprintf(
                    stderr,
                    ".\nUnable to get Leopard error state with '%s'.\n",
                    pv_status_to_string_func(error_status));
            exit(1);
        }

        if (message_stack_depth > 0) {
            fprintf(stderr, ":\n");
            print_error_message(message_stack, message_stack_depth);
        } else {
            fprintf(stderr, ".\n");
        }

        pv_free_error_stack_func(message_stack);
        exit(1);
    }

    struct timeval after;
    gettimeofday(&after, NULL);

    double init_sec = ((double) (after.tv_sec - before.tv_sec) +
            ((double) (after.tv_usec - before.tv_usec)) * 1e-6);
    fprintf(stdout, "init took %.1f sec\n", init_sec);

    double proc_sec = 0.;

    for (int32_t i = optind; i < argc; i++) {
        gettimeofday(&before, NULL);

        char *transcript = NULL;
        int32_t num_words = 0;
        pv_word_t *words = NULL;
        status = pv_leopard_process_file_func(
                leopard,
                argv[i],
                &transcript,
                &num_words, &words);
        if (status != PV_STATUS_SUCCESS) {
            fprintf(
                    stderr,
                    "failed to process with `%s`",
                    pv_status_to_string_func(status));
            error_status = pv_get_error_stack_func(&message_stack, &message_stack_depth);
            if (error_status != PV_STATUS_SUCCESS) {
                fprintf(
                        stderr,
                        ".\nUnable to get Leopard error state with '%s'.\n",
                        pv_status_to_string_func(error_status));
                exit(1);
            }

            if (message_stack_depth > 0) {
                fprintf(stderr, ":\n");
                print_error_message(message_stack, message_stack_depth);
            } else {
                fprintf(stderr, ".\n");
            }

            pv_free_error_stack_func(message_stack);
            exit(1);
        }

        gettimeofday(&after, NULL);

        proc_sec += ((double) (after.tv_sec - before.tv_sec) +
                     ((double) (after.tv_usec - before.tv_usec)) * 1e-6);

        fprintf(stdout, "%s\n", transcript);
        pv_leopard_transcript_delete_func(transcript);

        if (show_metadata) {
            for (int32_t j = 0; j < num_words; j++) {
                fprintf(
                        stdout,
                        "[%s]\t.start_sec = %.1f .end_sec = %.1f .confidence = %.2f .speaker_tag = %d\n",
                        words[j].word,
                        words[j].start_sec,
                        words[j].end_sec,
                        words[j].confidence,
                        words[j].speaker_tag);
            }
            printf("\n");
        }
        pv_leopard_words_delete_func(words);
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
      // WideCharToMultiByte:
      // https://docs.microsoft.com/en-us/windows/win32/api/stringapiset/nf-stringapiset-widechartomultibyte
      int arg_chars_num =
          WideCharToMultiByte(CP_UTF8, UTF8_COMPOSITION_FLAG, wargv[i],
                              NULL_TERMINATED, NULL, 0, NULL, NULL);
      utf8_argv[i] = (char *)malloc(arg_chars_num * sizeof(char));
      if (!utf8_argv[i]) {
        fprintf(stderr, "failed to to allocate memory for converting args");
      }
      WideCharToMultiByte(CP_UTF8, UTF8_COMPOSITION_FLAG, wargv[i],
                          NULL_TERMINATED, utf8_argv[i], arg_chars_num, NULL,
                          NULL);
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
