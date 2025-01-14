import * as React from 'react';
import type { ReactNode } from 'react';

import Trigger from 'rc-trigger';
import Portal from '@rc-component/portal';
import classNames from 'classnames';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import useTarget from './hooks/useTarget';
import type { Gap } from './hooks/useTarget';
import TourStep from './TourStep';
import type { TourStepInfo } from './TourStep';
import Mask from './Mask';
import placements, { getCenterPlacements } from './placements';
import type { TourStepProps } from './TourStep';
import type { PlacementType } from './placements';

const CENTER_ALIGN = {
  points: ['cc', 'cc'],
  offset: [0, 0],
};

const CENTER_PLACEHOLDER: React.CSSProperties = {
  left: '50%',
  top: '50%',
  width: 1,
  height: 1,
};

export interface TourProps {
  steps?: TourStepInfo[];
  open?: boolean;
  defaultCurrent?: number;
  current?: number;
  onChange?: (current: number) => void;
  onClose?: (current: number) => void;
  onFinish?: () => void;
  mask?: boolean;
  arrow?: boolean | { pointAtCenter: boolean };
  rootClassName?: string;
  placement?: PlacementType;
  prefixCls?: string;
  renderPanel?: (props: TourStepProps, current: number) => ReactNode;
  gap?: Gap;
}

const Tour = (props: TourProps) => {
  const {
    prefixCls = 'rc-tour',
    steps = [],
    defaultCurrent,
    current,
    onChange,
    onClose,
    onFinish,
    open,
    mask = true,
    arrow = true,
    rootClassName,
    placement = 'bottom',
    renderPanel,
    gap,
    ...restProps
  } = props;

  const [mergedCurrent, setMergedCurrent] = useMergedState(0, {
    value: current,
    defaultValue: defaultCurrent,
  });

  const [mergedOpen, setMergedOpen] = useMergedState(undefined, {
    value: open,
    postState: origin =>
      mergedCurrent < 0 || mergedCurrent >= steps.length
        ? false
        : origin ?? true,
  });

  const {
    target,
    placement: stepPlacement,
    style: stepStyle,
    arrow: stepArrow,
    className: stepClassName,
    mask: stepMask,
  } = steps[mergedCurrent] || {};

  const mergedPlacement = stepPlacement ?? placement;
  const mergedMask = mergedOpen && (stepMask ?? mask);
  const [posInfo, targetElement] = useTarget(target, open, gap);

  // ========================= arrow =========================
  const mergedArrow = targetElement
    ? typeof stepArrow === 'undefined'
      ? arrow
      : stepArrow
    : false;
  const arrowPointAtCenter =
    typeof mergedArrow === 'object' ? mergedArrow.pointAtCenter : false;
  const arrowClassName = classNames(`${prefixCls}-arrow`, {
    [`${prefixCls}-arrowPointAtCenter`]: arrowPointAtCenter,
  });

  // ========================= Change =========================
  const onInternalChange = (nextCurrent: number) => {
    setMergedCurrent(nextCurrent);
    onChange?.(nextCurrent);
  };

  // ========================= popupAlign =========================
  const popupAlign = targetElement
    ? arrowPointAtCenter
      ? getCenterPlacements({ placement })
      : placements[mergedPlacement]
    : CENTER_ALIGN;

  // ========================= Render =========================
  // Skip if not init yet
  if (targetElement === undefined) {
    return null;
  }

  const getPopupElement = () => {
    return (
      <div className={`${prefixCls}-content`}>
        {mergedArrow && <div className={arrowClassName} key="arrow" />}
        <TourStep
          key="content"
          prefixCls={prefixCls}
          total={steps.length}
          renderPanel={renderPanel}
          onPrev={() => {
            onInternalChange(mergedCurrent - 1);
          }}
          onNext={() => {
            onInternalChange(mergedCurrent + 1);
          }}
          onClose={() => {
            setMergedOpen(false);
            onClose?.(mergedCurrent);
          }}
          current={mergedCurrent}
          onFinish={() => {
            setMergedOpen(false);
            onClose?.(mergedCurrent);
            onFinish?.();
          }}
          {...steps[mergedCurrent]}
        />
      </div>
    );
  };

  return (
    <>
      <Trigger
        {...restProps}
        popupAlign={popupAlign}
        popupStyle={stepStyle}
        popupPlacement={mergedPlacement}
        builtinPlacements={placements}
        popupVisible={mergedOpen}
        popupClassName={classNames(rootClassName, stepClassName)}
        prefixCls={prefixCls}
        popup={getPopupElement}
        forceRender={false}
        destroyPopupOnHide
        zIndex={1090}
      >
        <Portal open={mergedOpen} autoLock>
          <div
            className={classNames(
              rootClassName,
              `${prefixCls}-target-placeholder`,
            )}
            style={{
              ...(posInfo || CENTER_PLACEHOLDER),
              position: 'fixed',
              pointerEvents: 'none',
            }}
          />
        </Portal>
      </Trigger>
      <Mask
        prefixCls={prefixCls}
        pos={posInfo}
        mask={mergedMask}
        open={mergedOpen}
        rootClassName={rootClassName}
      />
    </>
  );
};

export default Tour;
