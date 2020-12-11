import { readFileSync } from "fs";
import lexemes from "./TockenTypes.json";

interface Token {
  value: string;
  type: string;
  line: number;
  char: number;
}

class Lexing {
  lines: string[];
  tokens: Token[] = [];

  constructor(path: string) {
    console.log("\x1b[34m", "~ Start Lexing:", "\x1b[0m");

    // Text filtration
    // Read code and delete all commentaries from it
    this.lines = textFiltration(readFileSync(path, "utf-8"));

    console.log(this.lines);

    // Additional Functions
    function textFiltration(text: string): string[] {
      return text.split("\n").map((line) => {
        line = `${line}_`.slice(0, line.indexOf("#"));

        // Delete Commentaries on top of that if line become empty
        // after deleting commentary that it will 'erase' it
        // in other word replace with empty string
        return line.replace(/ /g, "").length ? line : "";
      });
    }
  }

  // defineTokens() {
  //   for (let i in this.lines) {
  //     let j = 0;
  //     let variable = "";
  //     let currLine: Token[] = [];

  //     while (this.lines[i][j] !== undefined) {
  //       // Find lexemes in the code
  //       let result = findLexeme(Number(i), j, this.lines[i]);

  //       switch (result.length) {
  //         // If there sever possible chooses then find the biggest one and save it
  //         default:
  //           result = [result[this.maxValueIndex(result)]];

  //         case 1:
  //           // Add a variable, which is not defined in TokenTypes
  //           if (variable) currLine.push(defineValue({ value: variable, type: "Variable", line: Number(i), char: j - variable.length }, currLine));

  //           currLine.push(defineSyntaxToken(result[0], currLine));
  //           j += result[0].value.length;

  //           variable = "";
  //           break;

  //         case 0:
  //           variable += this.lines[i][j];
  //           j++;
  //       }
  //     }

  //     if (variable) currLine.push(defineValue({ value: variable, type: "Variable", line: Number(i), char: j - variable.length }, currLine));

  //     // console.log(currLine);
  //     if (currLine[0]) this.tokens.push(currLine);
  //   }

  //   console.log(this.tokens);
  //   return this.tokens;

  //   //
  //   // Additional functions
  //   //
  //   function findLexeme(i: number, j: number, line: string) {
  //     let result = [];
  //     for (let k in lexemes) {
  //       if (k.includes(line[j] || " ") && k == line.substring(j, j + k.length)) result.push({ value: k, type: lexemes[k], line: Number(i), char: j });
  //     }
  //     return result;
  //   }

  //   function defineValue(token, currLine) {
  //     let prev = currLine.slice(-1)[0] || { type: "" };
  //     if (prev.type.includes("Number")) {
  //       // Update prev token
  //       currLine.splice(-1);
  //       prev.value += token.value;
  //       return defineVariable(prev, currLine);
  //     } else if (!isNaN(token.value)) token.type = token.value.includes(".") ? "Float Number" : "Number";

  //     return defineVariable(token, currLine);
  //   }

  //   function defineSyntaxToken(token, currLine) {
  //     if (token.type == "Quote Mark") {
  //       let index = -1;
  //       for (let i = 0; i < currLine.length; i++)
  //         if (token.value == currLine[i].value && currLine[i].type == "Quote Mark") {
  //           index = i;
  //           break;
  //         }

  //       if (index != -1) {
  //         let arr = currLine.splice(index + 1);

  //         // Get a char number of the string
  //         let { line, char } = currLine.pop();
  //         let str = "";
  //         for (let i in arr) str += arr[i].value;

  //         return { value: str, type: "String", line: line, char: char };
  //       }
  //     }

  //     if (includeArray(token.type, "Number", "Variable", "Keyword")) return defineVariable(token, currLine);
  //     return token;
  //   }

  //   function defineVariable(token, currLine) {
  //     let prev = currLine.slice(-1)[0];
  //     if (prev && includeArray(prev.type, "Variable", "Keyword")) {
  //       // Update prev token
  //       currLine.splice(-1);
  //       prev.value += token.value;
  //       prev.type = "Variable";
  //       return prev;
  //     }
  //     return token;
  //   }

  //   function includeArray(value, ...arr) {
  //     for (let el of arr) if (value.includes(el)) return true;
  //     return false;
  //   }
  // }

  // maxValueIndex(arr: Token[]) {
  //   let index = 0;
  //   let { value } = arr[index];

  //   for (let i = 1; i < arr.length; i++)
  //     if (value.length < arr[i].value.length) {
  //       index = i;
  //       value = arr[i].value.length;
  //     }

  //   return index;
  // }

  getTokens() {
    return this.tokens;
  }

  showTable() {
    console.log(`\n   Value\t|\tType\n${"_".repeat(16)}|${"_".repeat(35)}`);
    for (let i in this.tokens) console.log(`   '${this.tokens[i].value}'  \t|\t${this.tokens[i].type}`);
  }
}

export default Lexing;
