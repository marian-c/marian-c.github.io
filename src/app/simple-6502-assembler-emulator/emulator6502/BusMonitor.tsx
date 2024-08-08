import React from 'react';
import type { EmulationDriver6502 } from '@/app/simple-6502-assembler-emulator/emulator6502/types';
import { View } from '@/components/view/view';
import { useElementLayout } from '@/hooks/useElementLayout/useElementLayout';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { hex } from '@/helpers/numbers';
import { localStorageSimpleGet, localStorageSimpleSet } from '@/helpers/window/localStorageSimple';
import { div } from '@/vendor-in/my-emulator/_/numbers';

const CELLS_PER_ROW = 16;

type Data = { bytes: number[]; _driver: EmulationDriver6502 };

const VisualRow: React.FunctionComponent<{
  rowData: number[];
  leading: number;
  isHeader?: boolean | undefined;
  _driver: EmulationDriver6502;
}> = function ({ rowData, leading, isHeader, _driver }) {
  const isZeroPage = !isHeader && leading >= 0x0000 && leading <= 0x00ff;
  const isStack = !isHeader && leading >= 0x0100 && leading <= 0x01ff;

  const stkp = _driver.getBus().cpu.stkp;

  const valuesEl = rowData.map((cellValue, cellIndex) => {
    const isSP = !isHeader && leading + cellIndex === stkp + 0x0100;
    return (
      <span
        className={`font-mono inline-block h-full ${cellIndex === 7 ? 'pr-2' : ''} ${isHeader ? 'text-gray-500' : ''} ${isSP ? 'border border-green-500' : ''}`}
        key={cellIndex}
      >
        <span
          id={isHeader ? undefined : `emulator_rom_${leading + cellIndex}`}
          className="inline-block h-full hover:bg-[#ebf4ff]"
        >
          {hex(2, '', cellValue)
            .toUpperCase()
            .split('')
            .map((l, lIdx) => {
              return (
                <span
                  key={lIdx}
                  className={`group leading-[unset] text-lg ${lIdx === 0 ? 'pl-1.5' : 'pr-1.5'} inline-block h-full`}
                  onClick={() => {
                    console.info('TODO: cell', cellIndex, lIdx);
                  }}
                >
                  <span className="border-b border-transparent group-hover:border-[#67adef] p-0">
                    {l}
                  </span>
                </span>
              );
            })}
        </span>
      </span>
    );
  });

  return (
    <>
      <span
        className={`font-mono leading-[unset] text-lg pr-1 border-r border-r-neutral-700 h-full inline-block text-gray-500 ${isZeroPage ? 'bg-color-zero-page' : ''} ${isStack ? 'bg-color-stack' : ''}`}
      >
        {isHeader ? '↓↓↓→' : hex(4, '', leading || 0).toUpperCase()}
      </span>
      {valuesEl}
    </>
  );
};

const Row = ({ index, style, data }: ListChildComponentProps<Data>) => {
  const rowData = data.bytes.slice(index * CELLS_PER_ROW, (index + 1) * CELLS_PER_ROW);
  return (
    <div style={style}>
      <VisualRow rowData={rowData} leading={index * CELLS_PER_ROW} _driver={data._driver} />
    </div>
  );
};

export type BusMonitorImperativeHandle = { scrollToStackPointer: () => void };
type BusMonitorImperativeHandleRef = React.Ref<BusMonitorImperativeHandle>;

// TODO: have a way of programmatically tell it to scroll, TODO: highlight the cell it scrolled to
// TODO: have a way of declaratively tell it to scroll (prop: scrollTo, will keep the scroll in sync with the prop), TODO:hightlight the cell it scrolled to, if prop is different
// TODO: maybe have a rich editor for hex editing + selection across cell
// TODO: reset the scroll when uploading a new ROM (or reloading the current one)
const Grid: React.FunctionComponent<{
  _driver: EmulationDriver6502;
  height: number;
  imperativeHandleRef: BusMonitorImperativeHandleRef;
  $runOnMount: React.MutableRefObject<(() => void) | false>;
}> = function ({ height, imperativeHandleRef, $runOnMount, _driver }) {
  const data = _driver.getBus().mem;
  const ref = React.useRef<FixedSizeList<Data>>(null);
  const initialScrollOffset = React.useMemo(() => {
    return localStorageSimpleGet('bus_monitor_scroll', 0);
  }, []);
  React.useImperativeHandle(
    imperativeHandleRef,
    () => {
      return {
        scrollToStackPointer() {
          const stackPointer = _driver.getBus().cpu.stkp;
          const memoryLocation = 0x0100 + stackPointer;
          const rowIdx = div(memoryLocation, 16);
          ref.current?.scrollToItem(rowIdx, 'smart');
          document
            .getElementById(`emulator_rom_${memoryLocation}`)
            ?.animate([{ backgroundColor: 'yellow' }, { backgroundColor: 'transparent' }], {
              duration: 1300,
            });
        },
      };
    },
    [_driver],
  );
  React.useEffect(() => {
    if ($runOnMount.current !== false) {
      $runOnMount.current();
    }
  }, [$runOnMount]);
  return (
    <div className="whitespace-pre">
      <div className="h-full w-full relative">
        <div className="h-full w-full absolute">
          <FixedSizeList<Data>
            ref={ref}
            className="cursor-default"
            itemData={{ bytes: data, _driver }}
            height={height}
            width="100%"
            itemSize={30}
            itemCount={data.length / CELLS_PER_ROW}
            initialScrollOffset={initialScrollOffset}
            onScroll={({ scrollOffset }) => {
              localStorageSimpleSet('bus_monitor_scroll', scrollOffset);
            }}
          >
            {Row}
          </FixedSizeList>
        </div>
      </div>
    </div>
  );
};

const headerRow = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export const BusMonitor: React.FunctionComponent<{
  _driver: EmulationDriver6502;
  imperativeHandleRef: BusMonitorImperativeHandleRef;
  $runOnMount: React.MutableRefObject<(() => void) | false>;
}> = function ({ _driver, imperativeHandleRef, $runOnMount }) {
  const [height, setHeight] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  useElementLayout(containerRef, function (e) {
    setHeight(e.nativeEvent.layout.height);
  });
  return (
    <View grow>
      <div className="border-b border-b-neutral-500 pl-[1px]">
        <VisualRow rowData={headerRow} isHeader leading={0} _driver={_driver} />
      </div>
      <View
        grow
        containerRef={containerRef}
        className="overflow-hidden min-h-[200px] min-w-[400px] flex-1"
      >
        {height === 0 ? null : (
          <Grid
            _driver={_driver}
            height={height}
            imperativeHandleRef={imperativeHandleRef}
            $runOnMount={$runOnMount}
          />
        )}
      </View>
    </View>
  );
};
