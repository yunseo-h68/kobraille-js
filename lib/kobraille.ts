import kobrailleTable from "./kobrailleTable";
import { disassemble, isVowel } from "hangul-js";
import { bpds, Braille } from "braillepatterndots-js";

function isDoensori(str: string): boolean {
  switch (str) {
    case "ㄲ":
    case "ㄸ":
    case "ㅃ":
    case "ㅆ":
    case "ㅉ":
      return true;
  }
  return false;
}

function preprocessingDisassembleChar(dc: string[]): string[] {
  // 줄바꿈이거나 빈공간일 경우, 빈 문자열
  if (dc[0] === "\n" || dc[0] === " ") dc[0] = "";

  // 모음 하나만 있으면 모음을 중성자리로 이동
  if (isVowel(dc[0]) === true) {
    dc[1] = dc[0];
    dc[0] = "";
  }

  // 각 값이 존재하지 않으면 빈 문자열
  dc[1] = dc[1] !== "" ? dc[1] : "";
  dc[2] = dc[2] !== "" ? dc[2] : "";

  // 분해된 모음을 하나로 조립
  if (isVowel(dc[2]) === true) {
    switch (dc[1]) {
      case "ㅗ":
        switch (dc[2]) {
          case "ㅏ":
            dc[1] = "ㅘ";
            break;
          case "ㅐ":
            dc[1] = "ㅙ";
            break;
          case "ㅣ":
            dc[1] = "ㅚ";
            break;
          default:
        }
        dc[2] = dc[3] ? dc[3] : "";
        if (dc[2] !== "") dc.pop();
        break;
      case "ㅜ":
        switch (dc[2]) {
          case "ㅓ":
            dc[1] = "ㅝ";
            break;
          case "ㅔ":
            dc[1] = "ㅞ";
            break;
          case "ㅣ":
            dc[1] = "ㅟ";
            break;
          default:
        }
        dc[2] = dc[3] !== "" ? dc[3] : "";
        if (dc[2] !== "") dc.pop();
        break;
      case "ㅡ":
        if (dc[2] === "ㅣ") {
          dc[1] = "ㅢ";
        }
        dc[2] = dc[3] !== "" ? dc[3] : "";
        if (dc[2] !== "") dc.pop();
        break;
      default:
    }
  }

  return dc;
}

export default function (text: string) {
  const splitText = text.split("");
  const emptyBraille = bpds(0);
  return splitText.map((c, i) => {
    let result: Braille[] = [];
    // 한글 초,중,종성 분해 후 전처리
    const disassembleChar = preprocessingDisassembleChar(disassemble(c));

    // 초,중,종성 각각 점자 변환
    // 기본값 : 공백 점자
    let onset = emptyBraille;
    let nucleus = emptyBraille;
    let coda = emptyBraille;

    // 제 2항 'ㅇ'이 첫 소리 자리에 쓰일 떄는 생략한다.
    if (disassembleChar[0] !== "" && disassembleChar[0] === "ㅇ") {
      onset = kobrailleTable.onset[disassembleChar[0]];
    }
    if (disassembleChar[1] !== "") {
      nucleus = kobrailleTable.nucleus[disassembleChar[0]];
    }
    if (disassembleChar[2] !== "") {
      coda = kobrailleTable.coda[disassembleChar[0]];
    }

    // 제 3항 된소리 글자 'ㄲ, ㄸ, ㅃ, ㅆ, ㅉ'이 첫소리 자리에 쓰일 떄에는
    // 각각 'ㄱ,ㄷ,ㅂ,ㅅ,ㅈ' 앞에 된소리표 사입
    if (isDoensori(disassembleChar[0])) {
      onset.unshift(kobrailleTable.special["된소리표"]);
    }

    // 제 9항 자모가 단독으로 사용될 경우, 앞에 온표 삽입
    if (onset !== emptyBraille && disassembleChar[1] === "") {
      onset.unshift(kobrailleTable.special["온표"]);

      // 단독으로 쓰인 첫 소리 글자와 이어 나오는 글자는 혼동의 우려가
      // 있으므로 그 사이를 한 칸 띈다.
      if (splitText[i + 1] !== "'" && splitText[i + 1] !== '"') {
        onset.unshift(kobrailleTable.special["빈표"]);
      }
    }

    // 제 10항 모음자에 '예'가 이어 나올 때에는
    // 그 사이에 붙임표를 적어 나타낸다.
    // 받힘(종성) 자리에 붙임표를 넣어 해결한다.
    if (disassembleChar[2] === "" && splitText[i + 1] === "예") {
      coda = [kobrailleTable.special["붙임표"]];
    }

    // 제 11항 'ㅑ, ㅘ, ㅜ, ㅝ'에 '애'가 이어 나올 때에는
    // 그 사이에 붙임표를 적어 나타낸다.
    // 받힘(종성) 자리에 붙임표를 넣어 해결한다.
    if (
      ["ㅑ", "ㅘ", "ㅜ", "ㅝ"].indexOf(disassembleChar[1]) > -1 &&
      disassembleChar[2] === "" &&
      splitText[i + 1] === "애"
    ) {
      coda = [kobrailleTable.special["붙임표"]];
    }

    // 초성 자리 채우기
    onset.map((b) => {
      result.push(b);
    });
    nucleus.map((b) => {
      result.push(b);
    });
    coda.map((b) => {
      result.push(b);
    });

    return result;
  });
}
