/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
    CandleDataChart,
    bandLineData,
    calculateFibRetracement,
    calculateFibRetracementBandAreas,
    crosshair,
    drawDataHistory,
    drawnShapeEditAttributes,
    lineData,
    renderCanvasArray,
    scaleData,
    selectedDrawnData,
    setCanvasResolution,
} from '../../ChartUtils/chartUtils';
import {
    diffHashSig,
    diffHashSigScaleData,
} from '../../../../utils/functions/diffHashSig';
import { createCircle } from '../../ChartUtils/circle';
import { createLinearLineSeries } from './LinearLineSeries';
import {
    createArrowPointsOfDPRangeLine,
    createBandArea,
    createPointsOfBandLine,
    createPointsOfDPRangeLine,
} from './BandArea';
import { TradeDataContext } from '../../../../contexts/TradeDataContext';
import { CrocEnvContext } from '../../../../contexts/CrocEnvContext';
import { CandleData } from '../../../../App/functions/fetchCandleSeries';
import {
    defaultShapeAttributes,
    drawnShapeDefaultDash,
    fibDefaultLevels,
} from '../../ChartUtils/drawConstants';

interface DrawCanvasProps {
    scaleData: scaleData;
    setDrawnShapeHistory: React.Dispatch<
        React.SetStateAction<drawDataHistory[]>
    >;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCrossHairDataFunc: any;
    activeDrawingType: string;
    setActiveDrawingType: React.Dispatch<React.SetStateAction<string>>;
    setSelectedDrawnShape: React.Dispatch<
        React.SetStateAction<selectedDrawnData | undefined>
    >;
    denomInBase: boolean;
    addDrawActionStack: (item: drawDataHistory, isNewShape: boolean) => void;
    period: number;
    crosshairData: crosshair[];
    snapForCandle: (point: number, filtered: Array<CandleData>) => CandleData;
    visibleCandleData: CandleDataChart[];
    zoomBase: any;
    setIsChartZoom: React.Dispatch<React.SetStateAction<boolean>>;
    isChartZoom: boolean;
    firstCandleData: any;
    lastCandleData: any;
    render: any;
    isMagnetActive: { value: boolean };
    drawSettings: any;
}

function DrawCanvas(props: DrawCanvasProps) {
    const d3DrawCanvas = useRef<HTMLDivElement | null>(null);
    const [lineData, setLineData] = useState<lineData[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [bandArea, setBandArea] = useState<any>();
    const {
        scaleData,
        setDrawnShapeHistory,
        setCrossHairDataFunc,
        activeDrawingType,
        setActiveDrawingType,
        setSelectedDrawnShape,
        denomInBase,
        addDrawActionStack,
        snapForCandle,
        visibleCandleData,
        zoomBase,
        setIsChartZoom,
        isChartZoom,
        firstCandleData,
        lastCandleData,
        render,
        isMagnetActive,
        drawSettings,
    } = props;

    const {
        chainData: { poolIndex },
    } = useContext(CrocEnvContext);

    const circleSeries = createCircle(
        scaleData?.xScale,
        scaleData?.yScale,
        50,
        1,
        denomInBase,
    );
    const [lineSeries, setLineSeries] = useState<any>();
    const [borderLineSeries, setBorderLineSeries] = useState<any>();

    const currentPool = useContext(TradeDataContext);

    function createScaleForBandArea(x: number, x2: number) {
        const newXScale = scaleData?.xScale.copy();

        newXScale.range([scaleData?.xScale(x), scaleData?.xScale(x2)]);

        return newXScale;
    }

    useEffect(() => {
        if (scaleData) {
            const lineSeries = createLinearLineSeries(
                scaleData?.xScale,
                scaleData?.yScale,
                denomInBase,
                drawSettings[activeDrawingType].line,
            );
            setLineSeries(() => lineSeries);

            const borderLineSeries = createLinearLineSeries(
                scaleData?.xScale,
                scaleData?.yScale,
                denomInBase,
                drawSettings[activeDrawingType].border,
            );

            setBorderLineSeries(() => borderLineSeries);
        }
    }, [scaleData, denomInBase, diffHashSig(drawSettings), activeDrawingType]);

    useEffect(() => {
        if (scaleData !== undefined && !isChartZoom) {
            let wheellTimeout: NodeJS.Timeout | null = null; // Declare wheellTimeout
            const lastCandleDate = lastCandleData?.time * 1000;
            const firstCandleDate = firstCandleData?.time * 1000;
            d3.select(d3DrawCanvas.current).on(
                'wheel',
                function (event) {
                    if (wheellTimeout === null) {
                        setIsChartZoom(true);
                    }

                    zoomBase.zoomWithWheel(
                        event,
                        scaleData,
                        firstCandleDate,
                        lastCandleDate,
                    );
                    render();

                    if (wheellTimeout) {
                        clearTimeout(wheellTimeout);
                    }
                    // check wheel end
                    wheellTimeout = setTimeout(() => {
                        setIsChartZoom(false);
                    }, 200);
                },
                { passive: true },
            );
        }
    }, [diffHashSigScaleData(scaleData, 'x'), isChartZoom]);

    function getXandYvalueOfDrawnShape(offsetX: number, offsetY: number) {
        let valueY = scaleData?.yScale.invert(offsetY);
        const nearest = snapForCandle(offsetX, visibleCandleData);
        const close = denomInBase
            ? nearest?.invMinPriceExclMEVDecimalCorrected
            : nearest?.minPriceExclMEVDecimalCorrected;

        const open = denomInBase
            ? nearest?.invMaxPriceExclMEVDecimalCorrected
            : nearest?.maxPriceExclMEVDecimalCorrected;

        const closeToCoordinat = scaleData.yScale(close);

        const openToCoordinat = scaleData.yScale(open);

        const openDiff = Math.abs(offsetY - openToCoordinat);
        const closeDiff = Math.abs(offsetY - closeToCoordinat);

        if (isMagnetActive.value && (openDiff <= 100 || closeDiff <= 100)) {
            const minDiffForYValue = Math.min(openDiff, closeDiff);

            valueY = minDiffForYValue === openDiff ? open : close;
        }

        let valueX = nearest.time * 1000;
        const valueXLocation = scaleData.xScale(nearest.time * 1000);
        if (
            Math.abs(valueXLocation - offsetX) > 60 &&
            nearest === visibleCandleData[0]
        ) {
            valueX = scaleData?.xScale.invert(offsetX);
            valueY = scaleData?.yScale.invert(offsetY);
        }

        return { valueX: valueX, valueY: valueY };
    }

    useEffect(() => {
        const canvas = d3
            .select(d3DrawCanvas.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        const canvasRect = canvas.getBoundingClientRect();

        const threshold = 15;
        let cancelDraw = false;
        let isDrawing = false;
        const tempLineData: lineData[] = [];
        const localDrawSettings = drawSettings
            ? drawSettings[activeDrawingType]
            : defaultShapeAttributes;

        let touchTimeout: NodeJS.Timeout | null = null; // Declare touchTimeout

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cancelDrawEvent = (event: any) => {
            if (event.key === 'Escape') {
                cancelDraw = true;
                event.preventDefault();
                event.stopPropagation();
                document.removeEventListener('keydown', cancelDrawEvent);
            }
        };

        d3.select(d3DrawCanvas.current).on(
            'touchstart',
            (event: TouchEvent) => {
                const clientX = event.targetTouches[0].clientX;
                const clientY = event.targetTouches[0].clientY;
                startDrawing(clientX, clientY);
            },
        );

        d3.select(d3DrawCanvas.current).on('touchmove', (event: TouchEvent) => {
            const clientX = event.targetTouches[0].clientX;
            const clientY = event.targetTouches[0].clientY;
            draw(clientX, clientY);

            if (touchTimeout) {
                clearTimeout(touchTimeout);
            }
            // check touchmove end
            touchTimeout = setTimeout(() => {
                endDrawing(clientX, clientY);
            }, 500);
        });

        d3.select(d3DrawCanvas.current).on(
            'mousemove',
            (event: PointerEvent) => {
                draw(event.clientX, event.clientY);
            },
        );

        d3.select(d3DrawCanvas.current).on(
            'mousedown',
            (event: PointerEvent) => {
                document.addEventListener('keydown', cancelDrawEvent);

                startDrawing(event.clientX, event.clientY);
            },
        );

        d3.select(d3DrawCanvas.current).on('mouseup', (event: PointerEvent) => {
            endDrawing(event.clientX, event.clientY);
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function startDrawing(mouseX: number, mouseY: number) {
            isDrawing = true;
            const offsetY = mouseY - canvasRect?.top;
            const offsetX = mouseX - canvasRect?.left;

            const { valueX, valueY } = getXandYvalueOfDrawnShape(
                offsetX,
                offsetY,
            );

            if (valueY > 0) {
                if (tempLineData.length > 0 || activeDrawingType === 'Ray') {
                    endDrawing(mouseX, mouseY);
                } else {
                    tempLineData.push({
                        x: valueX,
                        y: valueY,
                        denomInBase: denomInBase,
                    });
                }

                setLineData(tempLineData);
                renderCanvasArray([d3DrawCanvas]);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function endDrawing(mouseX: number, mouseY: number) {
            if (!cancelDraw) {
                let endDraw = false;
                const offsetY = mouseY - canvasRect?.top;
                const offsetX = mouseX - canvasRect?.left;

                const { valueX, valueY } = getXandYvalueOfDrawnShape(
                    offsetX,
                    offsetY,
                );

                if (activeDrawingType !== 'Ray') {
                    const firstValueX = scaleData?.xScale(tempLineData[0].x);
                    const firstValueY = scaleData?.yScale(tempLineData[0].y);

                    const checkThreshold = Math.hypot(
                        offsetX - firstValueX,
                        offsetY - firstValueY,
                    );

                    endDraw = checkThreshold > threshold;
                }

                if (endDraw || activeDrawingType === 'Ray') {
                    if (activeDrawingType === 'Ray') {
                        tempLineData[0] = {
                            x: valueX,
                            y: valueY,
                            denomInBase: denomInBase,
                        };
                    }

                    tempLineData[1] = {
                        x: valueX,
                        y: valueY,
                        denomInBase: denomInBase,
                    };

                    isDrawing = false;

                    setActiveDrawingType('Cross');

                    const endPoint = {
                        data: tempLineData,
                        type: activeDrawingType,
                        time: Date.now(),
                        pool: {
                            poolIndex: poolIndex,
                            tokenA: currentPool.tokenA.address,
                            tokenB: currentPool.tokenB.address,
                            isTokenABase: currentPool.isTokenABase,
                            denomInBase: currentPool.isDenomBase,
                        },
                        extendLeft: localDrawSettings.extendLeft,
                        extendRight: localDrawSettings.extendRight,
                        labelPlacement: localDrawSettings.labelPlacement,
                        labelAlignment: localDrawSettings.labelAlignment,
                        reverse: localDrawSettings.false,
                        line: {
                            active: localDrawSettings.line.active,
                            color: localDrawSettings.line.color,
                            lineWidth: localDrawSettings.line.lineWidth,
                            dash: localDrawSettings.line.dash,
                        } as drawnShapeEditAttributes,

                        border: {
                            active: localDrawSettings.border.active,
                            color: localDrawSettings.border.color,
                            lineWidth: localDrawSettings.border.lineWidth,
                            dash: localDrawSettings.border.dash,
                        } as drawnShapeEditAttributes,

                        background: {
                            active: localDrawSettings.background.active,
                            color: localDrawSettings.background.color,
                            lineWidth: localDrawSettings.background.lineWidth,
                            dash: localDrawSettings.background.dash,
                        } as drawnShapeEditAttributes,

                        extraData: structuredClone(localDrawSettings.extraData),
                    };

                    setDrawnShapeHistory((prevData: drawDataHistory[]) => {
                        if (tempLineData.length > 0) {
                            endPoint.time = Date.now();
                            setSelectedDrawnShape({
                                data: endPoint,
                                selectedCircle: undefined,
                            });

                            return [...prevData, endPoint];
                        }
                        return prevData;
                    });
                    addDrawActionStack(endPoint, true);
                }
            } else {
                setActiveDrawingType('Cross');
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function draw(mouseX: number, mouseY: number) {
            if (!cancelDraw) {
                const offsetY = mouseY - canvasRect?.top;
                const offsetX = mouseX - canvasRect?.left;

                const { valueX, valueY } = getXandYvalueOfDrawnShape(
                    offsetX,
                    offsetY,
                );

                setCrossHairDataFunc(offsetX, offsetY);

                if (!isDrawing || activeDrawingType === 'Ray') return;

                if (valueY > 0) {
                    const newBandScale = createScaleForBandArea(
                        tempLineData[0].x,
                        scaleData.xScale.invert(offsetX),
                    );

                    const bandArea = createBandArea(
                        newBandScale,
                        scaleData?.yScale,
                        denomInBase,
                        drawSettings[activeDrawingType],
                    );

                    setBandArea(() => bandArea);

                    if (tempLineData.length === 1) {
                        tempLineData.push({
                            x: valueX,
                            y: valueY,
                            denomInBase: denomInBase,
                        });
                    } else {
                        tempLineData[1] = {
                            x: valueX,
                            y: valueY,
                            denomInBase: denomInBase,
                        };
                    }

                    setSelectedDrawnShape({
                        data: {
                            data: tempLineData,
                            type: activeDrawingType,
                            time: Date.now(),
                            extendLeft: false,
                            extendRight: false,
                            labelPlacement: 'Left',
                            labelAlignment: 'Middle',
                            reverse: false,
                            pool: {
                                poolIndex: poolIndex,
                                tokenA: currentPool.tokenA.address,
                                tokenB: currentPool.tokenB.address,
                                isTokenABase: currentPool.isTokenABase,
                                denomInBase: currentPool.isDenomBase,
                            },

                            line: {
                                active: !['Rect'].includes(activeDrawingType),
                                color: 'rgba(115, 113, 252, 1)',
                                lineWidth: 1.5,
                                dash:
                                    activeDrawingType === 'FibRetracement'
                                        ? [6, 6]
                                        : [0, 0],
                            } as drawnShapeEditAttributes,

                            border: {
                                active: ['Rect'].includes(activeDrawingType),
                                color: 'rgba(115, 113, 252, 1)',
                                lineWidth: 1.5,
                                dash: [0, 0],
                            } as drawnShapeEditAttributes,

                            background: {
                                active: ['Rect', 'DPRange'].includes(
                                    activeDrawingType,
                                ),
                                color: 'rgba(115, 113, 252, 0.15)',
                                lineWidth: 1.5,
                                dash: [0, 0],
                            } as drawnShapeEditAttributes,
                            extraData: ['FibRetracement'].includes(
                                activeDrawingType,
                            )
                                ? structuredClone(fibDefaultLevels)
                                : [],
                        },
                        selectedCircle: undefined,
                    });
                }
            } else {
                setSelectedDrawnShape(undefined);
                setLineData([]);
            }

            renderCanvasArray([d3DrawCanvas]);
        }
    }, [activeDrawingType, JSON.stringify(drawSettings)]);

    // Draw
    useEffect(() => {
        const canvas = d3
            .select(d3DrawCanvas.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        if (
            lineSeries &&
            scaleData &&
            (activeDrawingType === 'Brush' || activeDrawingType === 'Angle')
        ) {
            d3.select(d3DrawCanvas.current)
                .on('draw', () => {
                    setCanvasResolution(canvas);
                    lineSeries(lineData);
                    circleSeries(lineData);

                    if (activeDrawingType === 'Angle' && lineData.length > 0) {
                        if (lineData.length > 1) {
                            const opposite = Math.abs(
                                scaleData.yScale(lineData[0].y) -
                                    scaleData.yScale(lineData[1].y),
                            );
                            const side = Math.abs(
                                scaleData.xScale(lineData[0].x) -
                                    scaleData.xScale(lineData[1].x),
                            );

                            const distance = opposite / side;

                            const minAngleLineLength =
                                side / 4 > 80
                                    ? Math.abs(lineData[0].x - lineData[1].x) /
                                      4
                                    : scaleData.xScale.invert(
                                          scaleData.xScale(lineData[0].x) + 80,
                                      ) - lineData[0].x;

                            const minAngleTextLength =
                                lineData[0].x +
                                minAngleLineLength +
                                scaleData.xScale.invert(
                                    scaleData.xScale(lineData[0].x) + 20,
                                ) -
                                lineData[0].x;

                            const angleLineData = [
                                {
                                    x: lineData[0].x,
                                    y: lineData[0].y,
                                    denomInBase: lineData[0].denomInBase,
                                },
                                {
                                    x: lineData[0].x + minAngleLineLength,
                                    y: lineData[0].y,
                                    denomInBase: lineData[0].denomInBase,
                                },
                            ];

                            const angle = Math.atan(distance) * (180 / Math.PI);

                            const supplement =
                                lineData[1].x > lineData[0].x
                                    ? -Math.atan(distance)
                                    : Math.PI + Math.atan(distance);

                            const arcX =
                                lineData[1].y > lineData[0].y ? supplement : 0;
                            const arcY =
                                lineData[1].y > lineData[0].y ? 0 : -supplement;

                            const radius =
                                scaleData.xScale(
                                    lineData[0].x + minAngleLineLength,
                                ) - scaleData.xScale(lineData[0].x);

                            if (ctx) {
                                ctx.setLineDash([5, 3]);
                                lineSeries(angleLineData);

                                ctx.beginPath();
                                ctx.arc(
                                    scaleData.xScale(lineData[0].x),
                                    scaleData.yScale(lineData[0].y),
                                    radius,
                                    arcX,
                                    arcY,
                                );
                                ctx.stroke();

                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = 'white';
                                ctx.font = '50 12px Lexend Deca';

                                const angleDisplay =
                                    lineData[1].x > lineData[0].x
                                        ? angle
                                        : 180 - angle;

                                ctx.fillText(
                                    (lineData[1].y > lineData[0].y ? '' : '-') +
                                        angleDisplay.toFixed(0).toString() +
                                        'º',
                                    scaleData.xScale(minAngleTextLength),
                                    scaleData.yScale(lineData[0].y),
                                );

                                ctx.closePath();
                            }
                        }
                    }
                })
                .on('measure', (event: CustomEvent) => {
                    lineSeries.context(ctx);
                    circleSeries.context(ctx);
                    scaleData?.yScale.range([event.detail.height, 0]);
                });
        }
    }, [diffHashSig(lineData), lineSeries, denomInBase]);

    useEffect(() => {
        const canvas = d3
            .select(d3DrawCanvas.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        if (
            scaleData &&
            lineData.length > 1 &&
            (activeDrawingType === 'Rect' || activeDrawingType === 'DPRange')
        ) {
            d3.select(d3DrawCanvas.current)
                .on('draw', () => {
                    setCanvasResolution(canvas);

                    const bandData = {
                        fromValue: lineData[0].y,
                        toValue: lineData[1].y,
                        denomInBase: denomInBase,
                    } as bandLineData;

                    bandArea && bandArea([bandData]);

                    if (activeDrawingType === 'Rect') {
                        const lineOfBand = createPointsOfBandLine(lineData);

                        lineOfBand?.forEach((item) => {
                            borderLineSeries(item);
                            circleSeries(item);
                        });
                        if (drawSettings[activeDrawingType].line.active) {
                            lineSeries(lineData);
                        }
                    }

                    if (activeDrawingType === 'DPRange') {
                        const lineOfBand = createPointsOfDPRangeLine(lineData);

                        if (drawSettings[activeDrawingType].border.active) {
                            const lineOfBand = createPointsOfBandLine(lineData);

                            lineOfBand?.forEach((line) => {
                                borderLineSeries(line);
                            });
                        }
                        lineOfBand?.forEach((item) => {
                            lineSeries(item);
                        });
                        circleSeries(lineData);

                        const height = Math.abs(
                            scaleData.yScale(lineData[0].y) -
                                scaleData.yScale(lineData[1].y),
                        );
                        const width = Math.abs(
                            scaleData.xScale(lineData[0].x) -
                                scaleData.xScale(lineData[1].x),
                        );

                        if (height > 70 && width > 70) {
                            const arrowArray = createArrowPointsOfDPRangeLine(
                                lineData,
                                scaleData,
                                denomInBase,
                            );

                            arrowArray.forEach((arrow) => {
                                lineSeries(arrow);
                            });
                        }
                    }
                })
                .on('measure', (event: CustomEvent) => {
                    bandArea && bandArea.context(ctx);
                    lineSeries.context(ctx);
                    borderLineSeries.context(ctx);
                    circleSeries.context(ctx);
                    scaleData?.yScale.range([event.detail.height, 0]);
                });
        }
    }, [
        diffHashSig(lineData),
        denomInBase,
        bandArea,
        borderLineSeries,
        lineSeries,
    ]);

    useEffect(() => {
        const canvas = d3
            .select(d3DrawCanvas.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        const localDrawSettings = drawSettings
            ? drawSettings[activeDrawingType]
            : defaultShapeAttributes;
        if (
            scaleData &&
            lineData.length > 1 &&
            activeDrawingType === 'FibRetracement'
        ) {
            d3.select(d3DrawCanvas.current)
                .on('draw', () => {
                    setCanvasResolution(canvas);
                    lineSeries.decorate((context: CanvasRenderingContext2D) => {
                        context.strokeStyle = localDrawSettings.line.color;
                        context.lineWidth = localDrawSettings.line.lineWidth;
                        context.beginPath();
                        context.setLineDash(localDrawSettings.line.dash);
                        context.closePath();
                    });
                    lineSeries(lineData);

                    const fibLineData = calculateFibRetracement(
                        lineData,
                        localDrawSettings.extraData,
                    );

                    const bandAreaData = calculateFibRetracementBandAreas(
                        lineData,
                        localDrawSettings.extraData,
                    );

                    bandAreaData.forEach((bandData) => {
                        const color = d3.color(bandData.color);

                        if (color) {
                            color.opacity = 0.3;

                            bandArea.decorate(
                                (context: CanvasRenderingContext2D) => {
                                    context.fillStyle = color.toString();
                                },
                            );
                        }

                        bandArea([bandData]);
                    });

                    fibLineData.forEach((lineData) => {
                        lineSeries.decorate(
                            (context: CanvasRenderingContext2D) => {
                                context.strokeStyle = lineData[0].color;
                                context.lineWidth = 1.5;
                                context.beginPath();
                                context.setLineDash(drawnShapeDefaultDash);
                                context.closePath();
                            },
                        );
                        lineSeries(lineData);

                        if (ctx) {
                            ctx.fillStyle = lineData[0].color;
                            ctx.font = '12px Lexend Deca';
                            ctx.textAlign = 'right';
                            ctx.textBaseline = 'middle';

                            const lineLabel =
                                lineData[0].level +
                                ' (' +
                                lineData[0].y.toFixed(2).toString() +
                                ')';

                            ctx.fillText(
                                lineLabel,
                                scaleData.xScale(
                                    Math.min(lineData[0].x, lineData[1].x),
                                ) - 10,
                                scaleData.yScale(
                                    denomInBase === lineData[0].denomInBase
                                        ? lineData[0].y
                                        : 1 / lineData[0].y,
                                ),
                            );
                        }
                    });
                })
                .on('measure', (event: CustomEvent) => {
                    bandArea && bandArea.context(ctx);
                    lineSeries.context(ctx);
                    circleSeries.context(ctx);
                    scaleData?.yScale.range([event.detail.height, 0]);
                });
        }
    }, [diffHashSig(lineData), denomInBase, bandArea]);

    useEffect(() => {
        const canvas = d3
            .select(d3DrawCanvas.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        if (scaleData && lineData.length > 1 && activeDrawingType === 'Ray') {
            d3.select(d3DrawCanvas.current)
                .on('draw', () => {
                    setCanvasResolution(canvas);

                    circleSeries([
                        {
                            denomInBase: lineData[0].denomInBase,
                            y: lineData[0].y,
                            x: lineData[0].x,
                        },
                    ]);
                })
                .on('measure', (event: CustomEvent) => {
                    circleSeries.context(ctx);
                    scaleData?.yScale.range([event.detail.height, 0]);
                });
        }
    }, [diffHashSig(lineData), denomInBase]);

    return <d3fc-canvas ref={d3DrawCanvas} />;
}

export default DrawCanvas;
