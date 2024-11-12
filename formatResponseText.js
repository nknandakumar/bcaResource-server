// utils/formatResponseText.js

const formatResponseText = (text) => {
    text = text.replace(/\*\*/g, ""); // Remove bold markers
    text = text.replace(/#{1,6}\s*([^\n]+)/g, "\n\n$1\n\n"); // Format headings
    text = text.replace(/(\*\s*|\-\s*)([^\n]+)/g, "\n- $2\n"); // Format bullets
    text = text.replace(/(\d+\.\s*)([^\n]+)/g, "\n$1$2\n"); // Format numbered lists
    text = text.replace(/\n{2,}/g, "\n\n"); // Normalize line breaks
    text = text.replace(/([^\n])\n([^\n])/g, "$1\n\n$2"); // Add spacing between paragraphs
    return text.trim().replace(/\n{3,}/g, "\n\n");
  };
  
  export default formatResponseText;
  