import os
import shutil

import setuptools

os.system('git clean -dfx')

package_folder = os.path.join(os.path.dirname(__file__), 'pvleoparddemo')
os.mkdir(package_folder)

shutil.copy(os.path.join(os.path.dirname(__file__), '../../LICENSE'), package_folder)

shutil.copy(
    os.path.join(os.path.dirname(__file__), 'leopard_demo_file.py'),
    os.path.join(package_folder, 'leopard_demo_file.py'))

shutil.copy(
    os.path.join(os.path.dirname(__file__), 'leopard_demo_mic.py'),
    os.path.join(package_folder, 'leopard_demo_mic.py'))

with open(os.path.join(os.path.dirname(__file__), 'MANIFEST.in'), 'w') as f:
    f.write('include pvleoparddemo/LICENSE\n')
    f.write('include pvleoparddemo/leopard_demo_file.py\n')
    f.write('include pvleoparddemo/leopard_demo_mic.py\n')

with open(os.path.join(os.path.dirname(__file__), 'README.md'), 'r') as f:
    long_description = f.read()

setuptools.setup(
    name="pvleoparddemo",
    version="1.0.5",
    author="Picovoice",
    author_email="hello@picovoice.ai",
    description="Leopard speech-to-text engine demos",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Picovoice/leopard",
    packages=["pvleoparddemo"],
    install_requires=["pvleopard==1.0.4", "pvrecorder==1.0.2"],
    include_package_data=True,
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Topic :: Multimedia :: Sound/Audio :: Speech"
    ],
    entry_points=dict(
        console_scripts=[
            'leopard_demo_file=pvleoparddemo.leopard_demo_file:main',
            'leopard_demo_mic=pvleoparddemo.leopard_demo_mic:main',
        ],
    ),
    python_requires='>=3.5',
    keywords="Speech-to-Text, ASR, Speech Recognition, Voice Recognition",
)
