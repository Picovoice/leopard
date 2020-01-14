/*
    Copyright 2019 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

#ifndef PV_LEOPARD_H
#define PV_LEOPARD_H

#include <stdbool.h>
#include <stdint.h>

#include "picovoice.h"

#ifdef __cplusplus

extern "C"
{

#endif

/**
 * Forward Declaration for Speech-to-Text object. It transcribes speech within a given audio data. The incoming audio
 * needs to have a sample rate equal to 'pv_sample_rate()' and be 16-bit linearly-encoded. Leopard operates on
 * single-channel audio.
 */
typedef struct pv_leopard pv_leopard_t;

/**
 * Constructor.
 *
 * @param acoustic_model_path Absolute path to file containing acoustic model parameters.
 * @param language_model_path Absolute path to file containing language model parameters.
 * @param license_path Absolute path to a valid license file.
 * @param[out] object Constructed Speech-to-Text object.
 * @return Status code. Returns 'PV_STATUS_INVALID_ARGUMENT', 'PV_STATUS_IO_ERROR', or 'PV_STATUS_OUT_OF_MEMORY' on
 * failure.
 */
PV_API pv_status_t pv_leopard_init(
        const char *acoustic_model_path,
        const char *language_model_path,
        const char *license_path,
        pv_leopard_t **object);

/**
 * Destructor.
 *
 * @param object Speech-to-Text object.
 */
PV_API void pv_leopard_delete(pv_leopard_t *object);

/**
 * Processes a given audio data and returns its transcription.
 *
 * @param object Speech-to-Text object.
 * @param pcm Audio data. The audio needs to have a sample rate equal to 'pv_sample_rate()' and be 16-bit
 * linearly-encoded. Leopard operates on single-channel audio.
 * @param num_samples Number of audio samples to process.
 * @param[out] transcript Inferred transcription. The caller is responsible for freeing the transcription buffer.
 * @return Status code. Returns 'PV_STATUS_INVALID_ARGUMENT' or 'PV_STATUS_OUT_OF_MEMORY' on failure.
 */
PV_API pv_status_t pv_leopard_process(pv_leopard_t *object, const int16_t *pcm, int32_t num_samples, char **transcript);

/**
 * Getter for version.
 *
 * @return Version.
 */
PV_API const char *pv_leopard_version(void);

#ifdef __cplusplus

}

#endif

#endif // PV_LEOPARD_H
