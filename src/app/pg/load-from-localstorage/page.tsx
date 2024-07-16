// 'use client';
// import React from 'react';
// import { useLocalStorageSimpleState } from '@/hooks/useLocalStorageSimpleState';
// import { useLocalStorageArrayState } from '@/hooks/useLocalStorageArrayState';
// import { CopyButton } from '@/components/copy-button/copy-button';
//
// function Multiple() {
//   const { data, push, remove, set } = useLocalStorageArrayState('experiment-multiple', 0);
//
//   return (
//     <div>
//       MULTIPLE <CopyButton value="random" />
//       {data.map(([k, v]) => {
//         return (
//           <div key={k}>
//             <input
//               value={v}
//               onChange={(e) => {
//                 let newValue = e.target.value;
//                 if (newValue === '') {
//                   newValue = '0';
//                 }
//                 set(k, parseInt(newValue));
//               }}
//             />
//             <button
//               onClick={() => {
//                 remove(k);
//               }}
//             >
//               REMOVE
//             </button>
//           </div>
//         );
//       })}
//       <button
//         onClick={() => {
//           push(0);
//         }}
//       >
//         ADD
//       </button>
//     </div>
//   );
// }
//
// export default function PageLoadFromLocalStorage() {
//   const [n, setN] = useLocalStorageSimpleState('load-from-local-storage-exp');
//
//   return (
//     <>
//       <input
//         type="number"
//         value={n ?? ''}
//         onChange={(e) => {
//           const v = e.target.value;
//           const newN = v === '' ? 0 : parseInt(v, 10);
//           setN(newN);
//         }}
//       />
//       <hr />
//       <Multiple />
//     </>
//   );
// }

export default function PageLoadFromLocalStorage() {
  return 'TODO: bring this back maybe';
}
