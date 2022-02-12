#ifndef PV_LEOPARD_H
#define PV_LEOPARD_H

#include <dlfcn.h>
#include <stdint.h>
#include <stdlib.h>

typedef int32_t (*pv_leopard_sample_rate_func)();

int32_t pv_leopard_sample_rate_wrapper(void *f) {
     return ((pv_leopard_sample_rate_func) f)();
}

typedef char* (*pv_leopard_version_func)();

char* pv_leopard_version_wrapper(void* f) {
     return ((pv_leopard_version_func) f)();
}

typedef int32_t (*pv_leopard_init_func)(
	const char *access_key,
	const char *model_path,
	void **object);

int32_t pv_leopard_init_wrapper(
	void *f,
	const char *access_key,
	const char *model_path,
	void **object) {
	return ((pv_leopard_init_func) f)(
		access_key,
		model_path,
		object);
}

typedef int32_t (*pv_leopard_process_func)(
	void *object,
	const int16_t *pcm,
	int32_t num_samples,
	char **transcript);

int32_t pv_leopard_process_wrapper(
	void *f,
	void *object,
	const int16_t *pcm,
	int32_t num_samples,
	char **transcript) {
	return ((pv_leopard_process_func) f)(
		object,
		pcm,
		num_samples,
		transcript);
}

typedef int32_t (*pv_leopard_process_file_func)(
	void *object,
	const char *audio_path,
	char **transcript);

int32_t pv_leopard_process_file_wrapper(
	void *f,
	void *object,
	const char *audio_path,
	char **transcript) {
	return ((pv_leopard_process_file_func) f)(
		object,
		audio_path,
		transcript);
}

typedef void (*pv_leopard_delete_func)(void *);

void pv_leopard_delete_wrapper(void *f, void *object) {
	return ((pv_leopard_delete_func) f)(object);
}

#endif // PV_LEOPARD_H