#
# Copyright 2022-2023 Picovoice Inc.
#
# You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
# file accompanying this source.
#
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
# an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.
#

import os
import shutil

import setuptools

os.system('git clean -dfx')

package_folder = os.path.join(os.path.dirname(__file__), 'pvleopard')
os.mkdir(package_folder)

shutil.copy(os.path.join(os.path.dirname(__file__), '../../LICENSE'), package_folder)

shutil.copy(os.path.join(os.path.dirname(__file__), '__init__.py'), os.path.join(package_folder, '__init__.py'))
shutil.copy(os.path.join(os.path.dirname(__file__), '_factory.py'), os.path.join(package_folder, '_factory.py'))
shutil.copy(os.path.join(os.path.dirname(__file__), '_leopard.py'), os.path.join(package_folder, '_leopard.py'))
shutil.copy(os.path.join(os.path.dirname(__file__), '_util.py'), os.path.join(package_folder, '_util.py'))

platforms = ('jetson', 'linux', 'mac', 'raspberry-pi', 'windows')

os.mkdir(os.path.join(package_folder, 'lib'))
for platform in ('common',) + platforms:
    shutil.copytree(
        os.path.join(os.path.dirname(__file__), '../../lib', platform),
        os.path.join(package_folder, 'lib', platform))

MANIFEST_IN = """
include pvleopard/LICENSE
include pvleopard/__init__.py
include pvleopard/_factory.py
include pvleopard/_leopard.py
include pvleopard/_util.py
include pvleopard/lib/common/leopard_params.pv
recursive-include pvleopard/lib/jetson *
include pvleopard/lib/linux/x86_64/libpv_leopard.so
include pvleopard/lib/mac/x86_64/libpv_leopard.dylib
include pvleopard/lib/mac/arm64/libpv_leopard.dylib
recursive-include pvleopard/lib/raspberry-pi *
include pvleopard/lib/windows/amd64/libpv_leopard.dll
"""

with open(os.path.join(os.path.dirname(__file__), 'MANIFEST.in'), 'w') as f:
    f.write(MANIFEST_IN.strip('\n '))

with open(os.path.join(os.path.dirname(__file__), 'README.md'), 'r') as f:
    long_description = f.read()

setuptools.setup(
    name="pvleopard",
    version="1.2.2",
    author="Picovoice",
    author_email="hello@picovoice.ai",
    description="Leopard Speech-to-Text Engine.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Picovoice/leopard",
    packages=["pvleopard"],
    include_package_data=True,
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Topic :: Multimedia :: Sound/Audio :: Speech"
    ],
    python_requires='>=3.5',
    keywords="Speech-to-Text, Speech Recognition, Voice Recognition, ASR, Automatic Speech Recognition",
)
