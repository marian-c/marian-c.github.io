// 'use client';
// import React from 'react';
// import { textInputCN } from '@/app/classnames';
// import { Pane } from '@/components/pane/pane';
// import { Button } from '@/components/Button/Button';
// import { CopyButton } from '@/components/copy-button/copy-button';
// import { useLocalStorageArrayState } from '@/hooks/useLocalStorageArrayState';
// import { Icon } from '@/components/icon/icon';
//
// const WidgetHexConverter: React.FunctionComponent<
//   React.PropsWithChildren<{
//     value: number;
//     set: (newValue: number) => void;
//     duplicate: (newValue: number) => void;
//   }>
// > = function WidgetHexConverter({ value, set, duplicate }) {
//   const [hexValue, setHexValue] = React.useState<string | undefined>(() => {
//     return value.toString(16);
//   });
//   const [binValue, setBinValue] = React.useState<string | undefined>(() => {
//     return value.toString(2);
//   });
//   const paddedBinaryValue = (binValue || '0').padStart(32, '0');
//
//   const duplicateButtonEl = (
//     <Button
//       key="duplicate"
//       title="Duplicate this hex-converter"
//       onClick={() => {
//         duplicate(value);
//       }}
//       inaccessibleChildren={<Icon src="/svg/duplicate.svg" />}
//     />
//   );
//
//   return (
//     <>
//       <Pane header="Hex convertor" headerButtons={[duplicateButtonEl]}>
//         <table className="row-span-1">
//           <tbody>
//             <tr>
//               <td className="pr-10 text-right">
//                 <span>Decimal</span>
//               </td>
//               <td>
//                 <input
//                   className={`${textInputCN} font-mono text-lg`}
//                   type="number"
//                   value={value}
//                   min={0}
//                   max={0xffffffff}
//                   onChange={(e) => {
//                     const newValue = e.target.value;
//                     const newDecValue = parseInt(newValue, 10);
//                     set(newDecValue);
//                     setHexValue((newDecValue ?? 0).toString(16));
//                     const newBinValue = (newDecValue ?? 0).toString(2);
//                     setBinValue(newBinValue);
//                   }}
//                 />
//               </td>
//               <td className="text-right">
//                 <CopyButton title="Copy value to clipboard." value={value.toString()} />
//               </td>
//             </tr>
//             <tr>
//               <td className="pr-10pr-10">Hex</td>
//               <td className="">
//                 <input className={`${textInputCN} font-mono text-lg`} value={hexValue ?? ''} />
//               </td>
//               <td className="text-right">
//                 <CopyButton title="Copy hex value to clipboard." value={hexValue ?? ''} />
//                 <CopyButton
//                   title="Copy hex value with 0x prefix to clipboard."
//                   value={'0x' + (hexValue ?? '')}
//                 >
//                   <span> 0x...</span>
//                 </CopyButton>
//               </td>
//             </tr>
//             <tr>
//               <td className="pr-10 align-top">Binary</td>
//               <td>
//                 <div className="flex-col">
//                   {[0, 1].map((byteIndex) => {
//                     const byte = paddedBinaryValue.slice(16 * byteIndex, 16 * byteIndex + 16);
//                     return (
//                       <span className="block" key={byteIndex}>
//                         {Array.from(byte).map((bit, bitIndex) => {
//                           let ml = '';
//                           if (bitIndex === 8) {
//                             ml = 'ml-4';
//                           }
//                           if (bitIndex === 4 || bitIndex === 12) {
//                             ml = 'ml-2';
//                           }
//                           return (
//                             <span
//                               key={bitIndex}
//                               className={`${ml} inline-block font-mono p-0.5 hover:bg-[#c4e1ff] hover:cursor-pointer`}
//                             >
//                               {bit}
//                             </span>
//                           );
//                         })}
//                       </span>
//                     );
//                   })}
//                 </div>
//               </td>
//               <td className="pl-3 text-right align-top">
//                 <CopyButton title="Copy binary value to clipboard." value={paddedBinaryValue} />
//                 <CopyButton
//                   title="Copy binary value with prefix 0b to clipboard."
//                   value={'0b' + paddedBinaryValue}
//                 >
//                   <span> 0b...</span>
//                 </CopyButton>
//               </td>
//             </tr>
//           </tbody>
//         </table>
//       </Pane>
//     </>
//   );
// };
//
// export default function PageHexConverter() {
//   const { data, set, push } = useLocalStorageArrayState('hex-converter', 0);
//   return (
//     <div>
//       <h2>Page: hex converter</h2>
//
//       {data.map(([id, value]) => {
//         return (
//           <WidgetHexConverter
//             key={id}
//             value={value}
//             set={(newValue) => {
//               set(id, newValue);
//             }}
//             duplicate={(newValue) => {
//               push(newValue);
//             }}
//           />
//         );
//       })}
//     </div>
//   );
// }

export default function PageHexConverter() {
  return 'TODO: bring this back maybe';
}
