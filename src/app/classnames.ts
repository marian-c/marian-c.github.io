export const textInputCN = `
  border 
  border-[#7a7a7a] 
  
  leading-none
  
  outline-none 
  focus:border-[#2883da] 
  
  [&.flag-error]:border-red-500
  
  text-right
  p-1 
  
  focus:bg-[#ebf4ff]
  
  [&::-webkit-inner-spin-button]:appearance-none`;

export const tooltipCN = `
z-10
bg-[#1f2028] text-white border border-r-button-border p-2 whitespace-pre text-sm rounded shadow-2xl
`;
export const tooltipFloatingArrowCN = `
text-[#1f2028]
`;

export const textLinkCN = 'underline text-blue-700 cursor-pointer';

export const tableCN =
  'text-sm table-auto w-full border-collapse [&_td]:border-b [&_td]:border-b-slate-500 [&_td]:p-1 [&_td:nth-child(1)]:whitespace-pre [&_td:nth-child(2)]:break-all [&_td:nth-child(1)]:font-bold ';
