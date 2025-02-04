Pod::Spec.new do |s|
  s.name             = 'leopard_flutter'
  s.version          = '2.0.3'
  s.summary          = 'A Flutter package plugin for Picovoice\'s Leopard Speech-to-Text engine'
  s.description      = <<-DESC
  A Flutter package plugin for Picovoice\'s Leopard Speech-to-Text engine
                       DESC
  s.homepage         = 'https://picovoice.ai/'
  s.license          = { :type => 'Apache-2.0' }
  s.author           = { 'Picovoice' => 'hello@picovoice.ai' }
  s.source           = { :git => "https://github.com/Picovoice/leopard.git" }
  s.source_files = 'Classes/**/*'
  s.platform = :ios, '13.0'
  s.dependency 'Flutter'
  s.dependency 'Leopard-iOS', '~> 2.0.2'

  s.swift_version = '5.0'
end
