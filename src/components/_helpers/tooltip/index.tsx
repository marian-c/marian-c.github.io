import * as React from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  useMergeRefs,
  FloatingPortal,
  FloatingArrow,
  arrow,
  safePolygon,
  type UseHoverProps,
} from '@floating-ui/react';
import type { Placement } from '@floating-ui/react';
import { tooltipCN, tooltipFloatingArrowCN } from '@/app/classnames';
import type { FunctionComponentWithChildren } from '@/types';

interface TooltipOptions {
  initialOpen?: boolean;
  placement?: Placement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delay?: Exclude<UseHoverProps['delay'], undefined>;
}

export function useTooltip({
  initialOpen = false,
  placement = 'bottom',
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  delay,
}: TooltipOptions = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const arrowRef = React.useRef(null);

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 5,
      }),
      shift({ padding: 5 }),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const context = data.context;

  const hover = useHover(context, {
    move: false,
    enabled: controlledOpen == null,
    handleClose: safePolygon(),
    delay: delay ?? {},
  });
  const focus = useFocus(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const interactions = useInteractions([hover, focus, dismiss, role]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      ...interactions,
      ...data,
      arrowRef,
    }),
    [open, setOpen, interactions, data],
  );
}

type ContextType = ReturnType<typeof useTooltip> | null;

const TooltipContext = React.createContext<ContextType>(null);

export const useTooltipContext = () => {
  const context = React.useContext(TooltipContext);

  if (context == null) {
    throw new Error('Tooltip components must be wrapped in <Tooltip />');
  }

  return context;
};

function TooltipFull({
  children,
  enabled,
  ...options
}: { children: React.ReactNode; enabled?: boolean } & TooltipOptions) {
  const tooltip = useTooltip(options);
  return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

export function Tooltip({
  disabled,
  children,
  ...props
}: { children: React.ReactNode; disabled?: boolean } & TooltipOptions) {
  // This can accept any props as options, e.g. `placement`,
  // or other positioning options.

  if (disabled) {
    const toRender = React.Children.toArray(children).filter((c) => {
      if (
        typeof c === 'object' &&
        'type' in c &&
        ((c.type as any).name === 'TooltipTrigger' ||
          (c.type as any).render.name === 'TooltipTrigger')
      ) {
        return true;
      }
      return false;
    });
    return (toRender[0]! as any).props.children;
  }

  return <TooltipFull {...props}>{children}</TooltipFull>;
}
export const TooltipTrigger: FunctionComponentWithChildren<{
  asChild?: boolean;
  theRef?: React.Ref<HTMLElement>;
}> = function ({ children, asChild = false, theRef, ...props }) {
  const context = useTooltipContext();
  const childrenRef = (children as any).ref;
  const ref = useMergeRefs([context.refs.setReference, theRef, childrenRef]);

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    // xxx: maybe use Slot instead of straight cloning
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ...(typeof children.type === 'string' ? { ref } : { theRef: ref }),
        ...props,
        ...children.props,
        'data-state': context.open ? 'open' : 'closed',
      }),
    );
  }

  return (
    <button
      ref={ref}
      // The user can style the trigger based on the state
      data-state={context.open ? 'open' : 'closed'}
      {...context.getReferenceProps(props)}
    >
      {children}
    </button>
  );
};

export const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  function TooltipContent({ style, children, ...props }, propRef) {
    const context = useTooltipContext();
    const ref = useMergeRefs([context.refs.setFloating, propRef]);

    if (!context.open) return null;

    return (
      <FloatingPortal>
        <div
          className={tooltipCN}
          ref={ref}
          style={{
            ...context.floatingStyles,
            ...style,
          }}
          {...context.getFloatingProps(props)}
        >
          {children}
          <FloatingArrow
            className={tooltipFloatingArrowCN}
            ref={context.arrowRef}
            context={context.context}
          />
        </div>
      </FloatingPortal>
    );
  },
);
