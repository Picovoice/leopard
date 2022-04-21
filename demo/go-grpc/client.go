package main

import (
	"context"
	"flag"
	"github.com/pkg/errors"
	"google.golang.org/grpc"
	"io"
	"leopardgogrpc/messaging"
	"log"
	"os"
	"path/filepath"
	"time"
)

var (
	inputAudioPathArg = flag.String("input_audio", "", "Path to input audio file (valid: `FLAC`, `MP3`, `Ogg`, `Opus`, `Vorbis`, `WAV`, and `WebM`, 16-bit)")
	serverAddressArg  = flag.String("address", "localhost:5050", "The server address in the format of host:port")
)

func runTranscriptionFile(client messaging.LeopardServiceClient, filePath string) (err error) {

	var (
		writing = true
		buf     []byte
		n       int
		file    *os.File
		//status  *messaging.UploadStatus
	)

	file, err = os.Open(filePath)
	if err != nil {
		err = errors.Wrapf(err, "failed to open file %s", filePath)
		return
	}
	defer file.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	stream, err := client.GetTranscriptionFile(ctx)
	defer stream.CloseSend()
	if err != nil {
		log.Fatalf("%v.GetTranscriptionFile(_) = _, %v", client, err)
	}

	buf = make([]byte, 1024*1024*1024) // 1 MB
	for writing {
		n, err = file.Read(buf)
		if err != nil {
			if err == io.EOF {
				writing = false
				err = nil
				continue
			}

			err = errors.Wrapf(err, "errored while copying from file to buf")
			return
		}

		err = stream.Send(&messaging.Chunk{Content: buf[:n]})
		if err != nil {
			err = errors.Wrapf(err, "failed to send chunk via stream")
			return
		}
	}

	reply, err := stream.CloseAndRecv()
	if err != nil {
		log.Fatalf("%v.CloseAndRecv() got error %v, want %v", stream, err, nil)
	}
	log.Printf("replay: %v", reply)
	return err
}

func main() {
	flag.Parse()

	if *inputAudioPathArg == "" {
		log.Fatalln("No input audio file provided.")
	}
	inputAudioPath, _ := filepath.Abs(*inputAudioPathArg)
	f, err := os.Open(inputAudioPath)
	if err != nil {
		log.Fatalf("Unable to find or open input audio at %s\n", inputAudioPath)
	}
	defer f.Close()

	opts := grpc.WithInsecure()
	conn, err := grpc.Dial(*serverAddressArg, opts)
	if err != nil {
		log.Fatalf("fail to dial: %v", err)
	}
	defer conn.Close()

	client := messaging.NewLeopardServiceClient(conn)

	runTranscriptionFile(client, *inputAudioPathArg)
}
