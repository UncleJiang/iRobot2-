import React, { useState } from 'react';
import axios from 'axios';
import robotSVG from './assets/robot.svg';
import MicrophoneSVG from './assets/microphone.svg';
import sendSVG from './assets/send.svg';
import defaultSendSVG from './assets/defaultSend.svg';
import defaultMicroSVG from './assets/defaultMicro.svg';
import dayBtn from './assets/day.svg';
import myfaceSVG from './assets/myface.svg';
import closeBtn from './assets/close.svg';
import './App.css';

const { ipcRenderer, remote: { BrowserWindow } } = window.require('electron');


const MyWords = (props) => {
  return (<div className="wordsWrapper">
    <img src={myfaceSVG} className="myface" />
    <div className="words myWords">{props.words}</div>
  </div>);
}

const RobotWords = (props) => {
  if(props.isIframe){
    let tSrc = "//music.163.com/outchain/player?type=2&amp;id=" + props.words + "&amp;auto=1&amp;height=66";
    let tSrc2 = '//music.163.com/outchain/player?type=2&id='+props.words+'&auto=1&height=66';
    return (<div className={"wordsWrapper"}>
      <img src={robotSVG} className={"robotface"} />
      <iframe style={{frameborder:"no", border:"0", marginwidth:"0", marginheight:"0", width:330, height:86,}} src={tSrc2} />
        </div>);

  }else {

    return (<div className="wordsWrapper">
    <img src={robotSVG} className="robotface" />
    <div className={props.theme == 'default'?'words':'day-words'}>{props.words}</div>
    </div>);
  }

}

export default () => {
  const [words, setWords] = useState(undefined);
  const [isMicroing, setIsMicroing] = useState(false);
  const [isRecognizer, setIsRecognizer] = useState(false);
  const [wordList, setWordList] = useState([]);
  const [theme, setTheme] = useState("default");


  const handleMicro = () => {
    if (isRecognizer) return;
    const tecentMicro = isMicroing;
    setIsMicroing(!isMicroing);
    if (!tecentMicro) {
      ipcRenderer.send('startMicro');
    } else {
      const timer = setTimeout(() => {
        ipcRenderer.send('stopMicro');
        clearTimeout(timer);
      }, 1000);
      // ipcRenderer.send('stopMicro');
      setIsRecognizer(true);
    }
  }

  const handleKeyPress = (e) => {
    if (e.nativeEvent.keyCode === 13) {
      handlSendMsg();
    }
  }

  const handlSendMsg = () => {
    const myWords = {
      isRobot: false,
      words: words,
    }
    wordList.push(myWords);
    setWordList(wordList);
    scrollToBottom();

    var regexp1 = /^\u64ad\u653e/;
    var regexp2 = /\u5403\u4EC0\u4E48/;
    if (regexp1.test(words)) {

      var index = words.indexOf("放");
      const songname = words.substr(index + 1, words.length);
      //const songname = words;
      const songid = ipcRenderer.sendSync('163python', songname);

      const robotWords = {
        isRobot: true,
        isIframe: true,
        words: songid
      }
      ipcRenderer.send('startSpeaking', songid);
      wordList.push(robotWords);
      setWordList(wordList);
      setWords('');

    } else if (regexp2.test(words)) {
      var menu = new Array("煲仔饭", "卤肉饭", "石锅拌饭", "辛拉面", "小米米", "铁板饭", "泡面", "饭团", "寿司", "鸡排", "肯德基", "麦当劳", "火锅", "鸡公煲", "黄焖鸡米饭", "烧烤", "热干面", "炒面", "水煮鱼", "瓦罐汤", "凉皮");
      var temp = parseInt(Math.random() * 20);
      var diet = "吃" + menu[temp] + "!";
      const robotWords = {
        isRobot: true,
        isIframe: false,
        words: diet
      }
      ipcRenderer.send('startSpeaking', diet);
      wordList.push(robotWords);
      setWordList(wordList);
      setWords('');

    } else {
      axios.get(`http://106.12.196.243:8080/AI/sv?q=${words}`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }).then(({data}) => {
        const robotWords = {
          isRobot: true,
          words: data.response,
        };
        ipcRenderer.send('startSpeaking', data.response);
        wordList.push(robotWords);
        setWordList(wordList);
        setWords('');

      });
    }
     scrollToBottom();


  }

  function scrollToBottom() {
    const box = document.getElementsByClassName('wordsBox')[0];
    box.scrollTop = box.scrollHeight;
  }


  function changeTheme() {
    console.log("use changeMode()");
    if (theme == 'default') {
      setTheme("day");
    } else {
      setTheme('default');
    }
  }

    function handleCloseWindow() {
      const win = BrowserWindow.getFocusedWindow();
      win.close();
    }

    ipcRenderer.on('getRecognizer', (event, data) => {
      setWords(data.toString());
      setIsRecognizer(false);
    });

    return (
        <div className="App">
          <div className={theme === 'default' ? 'bg' : 'day-bg'}>
            <div className="bar left"></div>
            <div className="bar top"></div>
            <div className="bar right"></div>
            <div className="bar bottom"></div>
            <div className={theme === 'default' ? 'topbar' : 'day-topbar'}>
              <img src={dayBtn} className={theme === 'default' ? 'sun' : 'day-sun'} onClick={() => changeTheme()}/>
              <img src={robotSVG} className={theme === 'default' ? 'face' : 'day-face'}/>
              <img src={closeBtn} className="closeBtn" onClick={() => handleCloseWindow()}/>
            </div>
            <div className="bottomBox">
              <img src={isMicroing ? MicrophoneSVG : defaultMicroSVG} className="microBtn"
                   onClick={() => handleMicro()}/>
              {(isMicroing || isRecognizer) ?
                  <p className="microing" onClick={() => handleMicro()}>{isRecognizer ? '正在识别' : '录音中'}</p> :
                  <input className="textarea" value={words} onChange={e => setWords(e.target.value)}
                         onKeyPress={e => handleKeyPress(e)}/>}
              <img src={words ? sendSVG : defaultSendSVG} className="sendBtn" onClick={() => handlSendMsg()}/>
            </div>
            <div className="wordsBox">
              <RobotWords words="你好，我是机器人小i，快来和我聊天互动吧 ^ ^" theme={theme}/>

              {wordList.map((item, index) => item.isRobot ?
                  <RobotWords words={item.words} key={index} isIframe={item.isIframe}theme={theme}/> :
                  <MyWords words={item.words} key={index}/>)}
            </div>
          </div>
        </div>
    );
  }

