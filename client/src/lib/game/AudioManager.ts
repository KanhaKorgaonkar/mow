import { Howl, Howler } from 'howler';

export class AudioManager {
  private sounds: {
    mower?: Howl;
    grassCut?: Howl;
    discovery?: Howl;
    rain?: Howl;
    thunder?: Howl;
    ambient?: Howl;
  } = {};
  
  private isMowerPlaying: boolean = false;
  private soundsLoaded: boolean = false;

  constructor() {
    console.log("AudioManager created");
  }
  
  public async initialize() {
    try {
      console.log("AudioManager initializing...");
      
      // Using a base64-encoded MP3 for maximum compatibility
      const base64AudioData = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAAFUgD///////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAQoAAAAAAAABVKB48jY//////////////////////////////////////////////////////////////////gI+AAFAGQARgABAO4ABgAAMAAA4ADoAKAA//gIEAAFAGQASJRJj5Rj8qUqqpaUqeX//VTpdxMlHJfpw/pRnTaWD//74CAnKMgHFSfAOKk4CcJh4BZ9QeADg/AXCYOAb/YFwBjWsH+wB/xYjAz//BTI8BcaAHFSVv/+sQwAG5W3gTmT/9YmBNzmAeAw4fCgBxUoAcVKAHFSYH////////hJ//+sQwAF4T/gTmWAHfDgIyb///+DEeC8eBhoEZ///xYBP///////gI//8CZ/////////////////+EAf//////goH///gJn///////BAP//+sQwAG4OqgoeMgP+CIAP/gJn//////////+AAI/////AAAAf+AgJ//8GBM/////AAAH//wAnCQAB//8BAH//+Ay/////////rEMABuDL4A5lf///////////g5P///////wAAAf//gJn//wEBAP//AAAD//4CB/////gAAB//+AyAQAA///////////rEMABeEL4DjJP//////////////////////////ADYH/////////////+AmA////+AF//////////////+LAAH///////rEMABeD/4Djw///////////////////////////gBn////AwgNAf///////wEZ/////wFB/////////////+BAAP//////+sQwAF4P/gOPD//////////////////////////8BAf//+BgABQH/////////+AmP////gKD/////////////wIA///////6xDAAXg/+A48P//////////////////////////wUhf////AAAAH/////////+Akf//+AgP//////////////////////////rEMABeD/4Djw///////////////////////////8CAf////gQIC/////AAH///8BAf/////4Cc//////////////////////gD/////////rEMABeEr4EC5QAAAD//////////////////////////BAP//8AAD//wCD/////AAAAAAAAEAQ///////////////+B////////+sQwAGIOZgQeT///////////////////////////8EA//ACAD//8BAf//8A/////8AAD//+CAP//////////////8EB////////rEMABeCD4EC5P//////////////////////////+BAP//8EA///8EA///8BA/////wID//8BAP//////////////8CAf////wAD/+sQwAG4P/gQeT//////////////////////////+AgP//wEA///8CAf//4ID/////AQD//8BAP//////////////wID//////gAH/rEMABeD/4EHk//////////////////////////+AgP//wIB///8BAP//4IA/////AQH//wEA///////////////wMB//////wAB/+sQwAF4P/gQeT//////////////////////////+AgP//wEB///8EA///4EA/////AgH//wEA///////////////AQH/////AQH/rEMABeD/4EHlj/////////////////////////+BAP//wIB///8CAf//8EA/////AgH//wIA//////////////+BQP////8BAf/+sQwAF4P/gQeWP/////////////////////////+AgP//wEB///8BAP//4EB/////AoH//wEA///////////////AQH/////BAP/rEMABeD/4EHlj/////////////////////////+AgP//wEB///8CAf//4CA/////AwP//wEA//////////////8BAf////8BAf/+sQwAG4P/gQeWPYiDBwOoaE6MZqGUgIiABACA3/////+BQP//wIB///8CAf//8CA/////AQH//wEB///////////////ASH/////AQH/rEMABeDL4ALlABw8D3FQOADOYwDgbCgAQ8H//////AQH//wEB///8BAP//8BB/////AQH//wGB///////////////AQH/////AQH/+sQwAF4P/gQeWPcFAYDAFBDIMDGOQYbgAA4H//////AgH//wEB///8BAP//4EB/////AQH//wIB///////////////AQH/////AQH/+sQwAG4PVgQeWPYCocDIDhUjwVA8G4MAIDAf/////gQD//wEB///8CAf//4EA/////AQH//wEB///////////////AQH/////AgH//rEMABeD/4EHlj8BQOBbj0PAoGwLBFhgP/////gQD//wEA///8BAP//4CA/////AQH//wEB///////////////AQH/////AQH//+sQwAF4P/gQeWPYGB0FwwEAhh4L8oBgGAgG//////AQH//wEA///8BAP//4CA/////AQH//wEA///////////////gQD/////AgH//rEMABeD/4EHljyCAcDgOB8FRN4sF+MA4FAf/////AQD//wEA///8CAf//4CA/////AQH//wEA///////////////AYH/////AYH/+sQwAF4P/gQeWP/////+AgOA8H/NAfCIJh0H//////AQH//wEB///8BAP//4EA/////AQH//wCA///////////////AQD/////AQH/rEMABeD/4EHlj//////gUD/MwfhwKgIBwP/////AQH//wEA///8CAf//4EA/////AQH//wIB///////////////AQH/////AQH/+sQwAF4P/gQeWP/////+AgOA8D/GgYDANBoH//////AQH//wEB///8BAP//8CA/////AQH//wIB///////////////AQH/////AQH/rEMABeD/4EHlj//////gQD/GwQDIPA0CAP/////AgH//wEB///8BAP//4EA/////AQH//wIB///////////////AQH/////AQH/+sQwAF4P/gMeWP/////+BAP4xB8GAdB0GAf/////gQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQH/////AQH/rEMABeDL4ALlABw+HfK4fA/CgZAwIYbAgD/////AQH//wEB///8CAf//4EA/////AQH//wEB//////////////+AgH/////AQH/+sQwAF4P/gQeWPYKh/z0HwYBwFgaAoFAf/////AQH//wEA///8BAP//4CA/////AQH//wEB///////////////AQH/////AQH/+sQwAF4P/gQeWP/////+BAP8xB8GAbBwGAf/////AQH//wEA///8BAP//wEA/////AQH//wEA///////////////AQD/////AQH//rEMABeD/4EHlj//////gUD/HAbAoFgbB4H//////AQH//wEB///8BAP//4CA/////AQH//wEB///////////////AQH/////AQH//+sQwAF4S/gMeWP/////+BAP8dA+DAOhADgP/////gQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH//rEMABuEv4DjyE2AIACFAaAxnwUB0BgGB/P/////wEB//wEA///8BAf//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4PXgOWWbAA4dAF4fAYiMP+dAtCQMB/P/////AQD//wEA///8BAP//4CA/////AQH//wIB///////////////AQD/////AQH/rEMABeDl4BFygA4H8dhcCA0B0CgYBwFgfz//////gQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPcGBgPA7g4EQ6CIPQkC4Lg/n//////AQD//wEA///8BAP//4CA/////AQH//wEA//////////////+AgD/////AQH/rEMABuD/4EHljwBg8DcFQNhcJwhCcLAvD+f//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPcKA/xwG8YBgLEcB8DgLg/n//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj3BgcBAMY8B2GAdjYHA4Hwfz//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPcHAfx4D8MA+BwFwYCEP5//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHljyBgf48B+GQfCILgsB4H8///////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4Q/gMeWPcHgf47B+GQbAoDwLA8D+f//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHljwB4f48B+GgbA4CYNhEH8///////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPcHgf47B+GoaAoDwTA+D+f//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHljwCAf48B+GYaBIDwTA+D+f//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPcIgf47B+GYaA4DwTBoH8///////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj3B4f48B+GgZBMCgTA+D+P//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPcIgf47B+GwZBMCgSBoH8P//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHljyB4f48B+GoaBMCgSA+D+P//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPcIgf47B+GwaBMCgSA+D+P//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHljyB4f48B+GoaBMCgSA+D+P//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4PXgOWWbA4H9KoeiIJgoEQSgkB+P//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2Bgf0sBiIcaA+CQTgfh/D//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPcJg/p0D0NgmBkEwSA8B+D//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4P6Rg3DAMgaBgLwfg/B//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHg/pMDUNgoBwGAaA6B8D//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHljyB4P6UAlDAIgSBgJweA8B//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHg/pwDUMA0CwEgPAwA8B//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHljyB4PyVAwDAJAWAkB8DwHgP/////AQD//wEA///8BAP//4CA/////AQH//wEB///////////////AQD/////AQH/+sQwAF4P/gQeWPYHg/pqCULgyB4EwKAcA+B//////AQD//wEA///8BAP//4CA/////AQH//wEB///////////////AQD/////AQH/rEMABeD/4EHlj2B4P6ZglDAMgSA4BoDwHgP/////AQD//wEA///8BAP//4CA/////AQH//wEB///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf1EBKFwOAkBoGgHAPgeA/////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9KAaiQGgOA0A4B4BwD//////AQD//wEB///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0wA6GgaA8BwBAHgHAP/////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9JoWhkFAPAuAgA8A4D//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGgQA+BcBABwDgP/////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAQAcA4D//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4PXgOWWbA8D+lkKQyCQHwHAEAHAOA//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4P/gQeWPYHgf0sBaGASA+A4AgA4BwH//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4PXgOWWbA8D+lkKQyCQHwHAEAHAOA//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/rEMABeD/4EHlj2B4H9LAWhgEgPgOAIAOAcB//////AQD//wEA///8BAP//4CA/////AQH//wEA///////////////AQD/////AQH/+sQwAF4QvgOWWbA8EKQYAEAD4AAACA4DwH//////AQH//wEA//////////+AgP//////gQD//////////////////////wEB//////+sQwAG4LXgOWWgD5SuXHBRkeCgjqaC6C57///////wIB//8EA//////////+AgP//////gQD//////////////////////wEB/////wIB/rEMABeEX4DllxnYQnBBQpK9WgQnB8tWqKr///////wMD//wQD//////////+BAP//////gYH//////////////////////wMD/////AQH/+sQwAF4T/gOWXooxaCSgZQIjZkkIJLLQr1///////8BAP//AQD//////////4EA//////8BAP//////////////////////AgP/////BAP/rEMABeDD4DllFSGAhmtS1VGLZYQUUSGmHf///////8BAP//gID//////////4ID//////+BAfAAAAICAQEBAQIBAwMDBAQFAgICAgIDAwIF/////rEMABuD74Djkgv+UkGEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISEhISAhISAgAAwYCGQiFgyYGBsQMDEQMBgMAAAAAAAAAA=';
      
      // Load mower sound using base64-encoded audio
      this.sounds.mower = new Howl({
        src: [base64AudioData],
        loop: true,
        volume: 0.7,
        rate: 1.0,
        preload: true,
        onload: () => {
          console.log("Mower sound loaded successfully");
          this.soundsLoaded = true;
        },
        onloaderror: (id, error) => {
          console.error("Error loading mower sound:", error);
        },
        onplayerror: (id, error) => {
          console.error("Error playing mower sound:", error);
          // Try unlocking audio
          Howler.volume(0);
          setTimeout(() => {
            Howler.volume(1);
          }, 10);
        }
      });
      
      // Create simple sounds for other effects using the same base64 audio
      this.sounds.grassCut = new Howl({
        src: [base64AudioData],
        volume: 0.3,
        rate: 1.5,  // Higher pitch
        duration: 0.3 // Short clip
      });
      
      this.sounds.discovery = new Howl({
        src: [base64AudioData],
        volume: 0.5,
        rate: 0.8,  // Lower pitch
        duration: 1.0
      });
      
      this.sounds.rain = new Howl({
        src: [base64AudioData],
        volume: 0.2,
        rate: 0.5,  // Much lower pitch
        loop: true
      });
      
      console.log("AudioManager initialized");
      return true;
    } catch (error) {
      console.error("Error initializing AudioManager:", error);
      return false;
    }
  }
  
  public playAmbient() {
    if (this.sounds.ambient) {
      this.sounds.ambient.play();
    }
  }
  
  public playMower() {
    if (this.sounds.mower && !this.isMowerPlaying) {
      this.sounds.mower.play();
      this.isMowerPlaying = true;
    }
  }
  
  public pauseMower() {
    if (this.sounds.mower && this.isMowerPlaying) {
      this.sounds.mower.pause();
      this.isMowerPlaying = false;
    }
  }
  
  public playGrassCut() {
    if (this.sounds.grassCut) {
      // Play a fresh instance to allow overlapping sounds
      this.sounds.grassCut.play();
    }
  }
  
  public playDiscovery() {
    if (this.sounds.discovery) {
      this.sounds.discovery.play();
    }
  }
  
  public playRain() {
    if (this.sounds.rain) {
      this.sounds.rain.play();
    }
  }
  
  public pauseRain() {
    if (this.sounds.rain) {
      this.sounds.rain.pause();
    }
  }
  
  public playThunder() {
    if (this.sounds.thunder) {
      this.sounds.thunder.play();
    }
  }
  
  public pauseAll() {
    Howler.volume(0);
  }
  
  public resumeAll() {
    Howler.volume(1);
  }
  
  public stopAll() {
    Howler.stop();
    this.isMowerPlaying = false;
  }
}
