if [ ! -d "./leopard-test-app/src/androidTest/assets/test_resources/audio_samples" ]
then
    echo "Creating test audio samples directory..."
    mkdir -p ./leopard-test-app/src/androidTest/assets/test_resources/audio_samples
fi

echo "Copying test audio samples..."
cp ../../../resources/audio_samples/*.wav ./leopard-test-app/src/androidTest/assets/test_resources/audio_samples

if [ ! -d "./leopard-test-app/src/androidTest/assets/test_resources/model_files" ]
then
    echo "Creating test model files directory..."
    mkdir -p ./leopard-test-app/src/androidTest/assets/test_resources/model_files
fi

echo "Copying leopard model files ..."
cp ../../../lib/common/*.pv ./leopard-test-app/src/androidTest/assets/test_resources/model_files

echo "Copying test data file..."
cp ../../../resources/.test/test_data.json ./leopard-test-app/src/androidTest/assets/test_resources
