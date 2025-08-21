import { Output } from "@mui/icons-material";
import { MathJax} from "better-react-mathjax";
import React from "react";

export const QuestionMathJaxConfig = {
//     loader: {load: ["input/tex", "output/chtml"]},
//     tex: {
//         inlineMath: [["$","$"], ["\\(","\\)"]],
//         displayMath: [["$","$"], ["\\[","\\]"]],
//         processEscapes: true,
//     },
//     options:{
//         enableMenu: false,
//         skipHTMLTags:["script", "noscript", "style", "textarea", "pre", "code"],
//     },
// };
loader: { load: ["input/tex", "output/chtml"] },
tex: {
  inlineMath: [["$", "$"], ["\\(", "\\)"]],
  displayMath: [["$$", "$$"], ["\\[", "\\]"]],
  processEscapes: true,
},
options: {
  enableMenu: false,
  skipHTMLTags: ["script", "noscript", "style", "textarea", "pre", "code"],
},
};

const QuestionMathJax = React.memo(({content}) => {
    if(!content) return null;

    return(
        <MathJax>
        {typeof content === "string" ? content : JSON.stringify(content)}
      </MathJax>
    );
});

export default QuestionMathJax;