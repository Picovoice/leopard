//
//  Copyright 2022 Picovoice Inc.
//  You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
//  file accompanying this source.
//  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
//  an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
//  specific language governing permissions and limitations under the License.
//

import SwiftUI

struct ContentView: View {
    @StateObject var viewModel = ViewModel()

    let activeBlue = Color(red: 55/255, green: 125/255, blue: 1, opacity: 1)
    let dangerRed = Color(red: 1, green: 14/255, blue: 14/255, opacity: 1)
    let navyBlue = Color(red: 37/255, green: 24/255, blue: 126/255, opacity: 1)

    var body: some View {
        let interactionDisabled = !viewModel.errorMessage.isEmpty || viewModel.state == UIState.PROCESSING ||
                viewModel.state == UIState.INIT

        VStack(spacing: 10) {
            Spacer()

            ScrollView {
                Text(viewModel.result)
                        .padding()
                        .fixedSize(horizontal: false, vertical: true)
                        .foregroundColor(Color.white)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                        .font(.title3)
            }.frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(navyBlue)

            Spacer()

            if viewModel.state == .PROCESSING {
                Text("Processing audio...")
                        .padding()
                        .font(.body)
                        .foregroundColor(Color.black)
            } else if viewModel.state == .RECORDING {
                Text(String(format: "Recording : %.1f / 120 (seconds)", viewModel.recordingTimeSec))
                        .padding()
                        .font(.body)
                        .foregroundColor(Color.black)
            } else if viewModel.state == .TRANSCRIBED {
                Text(String(format: "Transcribed %.1f(s) of audio in %.1f(s).",
                            viewModel.recordingTimeSec,
                            viewModel.transcribeTimeSec))
                        .padding()
                        .font(.body)
                        .foregroundColor(Color.black)
            } else {
                Text(viewModel.errorMessage)
                        .padding()
                        .foregroundColor(Color.white)
                        .frame(maxWidth: .infinity)
                        .background(dangerRed)
                        .font(.body)
                        .opacity(viewModel.errorMessage.isEmpty ? 0 : 1)
                        .cornerRadius(10)
            }

            Spacer()

            Button(action: {
                viewModel.toggleRecording()
            }) {
                Text(viewModel.state == .RECORDING ? "STOP" : "START")
                        .padding()
                        .background(interactionDisabled ? Color.gray : activeBlue)
                        .foregroundColor(Color.white)
                        .font(.largeTitle)
            }.disabled(interactionDisabled)
        }.onReceive(NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification), perform: { output in
                viewModel.initialize()
        }).onReceive(NotificationCenter.default.publisher(for: UIApplication.didEnterBackgroundNotification), perform: { output in
                viewModel.destroy()
        })
                .padding()
                .frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
                .background(Color.white)

    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
