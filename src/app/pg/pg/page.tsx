import { LayoutSpread } from '@/components/_layouts/LayoutSpread';
import { Button } from '@/components/Button/Button';

export default function PagePg() {
  return (
    <>
      <LayoutSpread useChild dontWrapLeft>
        <div className="text-red-400">
          <Button>Left</Button>
          Right
        </div>
      </LayoutSpread>
    </>
  );
}
