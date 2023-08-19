import React, { useState } from 'react';
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { styled } from 'styled-components';
import axios from 'axios';

library.add(faMicrophone);

const MicrophoneIcon = styled(FontAwesomeIcon)`
    z-index: 2;
    position: absolute;
    bottom: 1rem;
    color: gray;
    right: 1rem;
    &:hover {
    cursor: pointer;
  }
`;

const AudioRecord = (props) => {
  const [stream, setStream] = useState();
  const [media, setMedia] = useState();
  const [onRec, setOnRec] = useState(true);
  const [source, setSource] = useState();
  const [analyser, setAnalyser] = useState();
  const [audioUrl, setAudioUrl] = useState();
//   const [disabled, setDisabled] = useState(true);

  const onRecAudio = () => {

    // setDisabled(true)
    
    // 음원정보를 담은 노드를 생성하거나 음원을 실행또는 디코딩 시키는 일을 한다
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // 자바스크립트를 통해 음원의 진행상태에 직접접근에 사용된다.
    const analyser = audioCtx.createScriptProcessor(0, 1, 1);
    setAnalyser(analyser);

    function makeSound(stream) {
      // 내 컴퓨터의 마이크나 다른 소스를 통해 발생한 오디오 스트림의 정보를 보여준다.
      const source = audioCtx.createMediaStreamSource(stream);
      setSource(source);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
    // 마이크 사용 권한 획득
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.start();
      setStream(stream);
      setMedia(mediaRecorder);
      makeSound(stream);

      analyser.onaudioprocess = function (e) {
        // 3분(180초) 지나면 자동으로 음성 저장 및 녹음 중지
        if (e.playbackTime > 180) {
          stream.getAudioTracks().forEach(function (track) {
            track.stop();
          });
          mediaRecorder.stop();
          // 메서드가 호출 된 노드 연결 해제
          analyser.disconnect();
          audioCtx.createMediaStreamSource(stream).disconnect();

          mediaRecorder.ondataavailable = function (e) {
            setAudioUrl(e.data);
            setOnRec(true);
          };
        } else {
          setOnRec(false);
        }
      };
    });
  };

  // 사용자가 음성 녹음을 중지 했을 때
  const offRecAudio = async () => {
    // dataavailable 이벤트로 Blob 데이터에 대한 응답을 받을 수 있음
    media.ondataavailable = function (e) {
      setAudioUrl(e.data);
      setOnRec(true);
    };

    // 모든 트랙에서 stop()을 호출해 오디오 스트림을 정지
    stream.getAudioTracks().forEach(function (track) {
      track.stop();
    });

    // 미디어 캡처 중지
    media.stop();

    // 메서드가 호출 된 노드 연결 해제
    analyser.disconnect();
    source.disconnect();
    
    if (audioUrl) {
      URL.createObjectURL(audioUrl); // 출력된 링크에서 녹음된 오디오 확인 가능
    }
    
    // File 생성자를 사용해 파일로 변환
    // const sound = new File([audioUrl], "soundBlob", {
    //   lastModified: new Date().getTime(),
    //   type: "audio",
    // });
  	
    // setDisabled(false);
    serverPostRecord();
  };

//   const play = () => { 
//     const audio = new Audio(URL.createObjectURL(audioUrl));
//     audio.loop = false;
//     audio.volume = 1;
//     audio.play();
//   };

  async function serverPostRecord(){
    try {
        const audioBlob = new Blob([audioUrl], { type: 'audio/ogg codecs=opus' });

        const res = await axios.post(`https://stalksound.store/sonification/speech_to_text/`,{
            "audio" : audioBlob
        },  {
            headers: {
            'Content-Type': 'multipart/form-data', // Set the content type as binary
            }, });
        
            console.log(res);
            const data = res.data;
            props.propFunction(JSON.parse(data));
        }
    catch (e) {
        console.log(e);
        alert("음성 인식에 실패했습니다. 녹음을 다시 한번 시도해 주세요!");
    }
}

    // console.log(returnText);

    return (
        <>
            <MicrophoneIcon icon={faMicrophone} onClick={onRec ? onRecAudio : offRecAudio} beatFade={!onRec}></MicrophoneIcon>
        </>
    );
};

export default AudioRecord;