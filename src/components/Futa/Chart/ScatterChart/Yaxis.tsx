import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { renderCanvasArray } from '../../../../pages/platformAmbient/Chart/ChartUtils/chartUtils';

interface AxisIF {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    scale: d3.ScaleLinear<number, number> | undefined;
    axisColor: string;
    textColor: string;
}
export default function Yaxis(props: AxisIF) {
    const d3YaxisRef = useRef<HTMLInputElement | null>(null);
    const { data, scale, axisColor, textColor } = props;

    useEffect(() => {
        if (scale) {
            const heightYAxis = scale.range()[0] + scale.range()[1];
            const tickCount = heightYAxis < 350 ? 5 : 10;

            const yAxis = d3
                .axisLeft(scale)
                .tickValues(scale.ticks(tickCount).filter((i) => i >= 0))
                .tickFormat((d) => `${(Number(d) / 1000).toFixed(0)}k`);

            const d3LinearAxisJoin = d3fc.dataJoin('g', 'd3-axis-linear');
            d3.select(d3YaxisRef.current).on('draw', () => {
                const svg = d3.select(d3YaxisRef.current).select('svg');
                svg.attr(
                    'viewBox',
                    `${-30} ${0} ${20} ${scale.range()[0] + 1}`,
                );
                svg.select('g')
                    .selectAll('path, line')
                    .attr('stroke', axisColor);
                svg.select('g')
                    .selectAll('text')
                    .attr('fill', textColor)
                    .style('font-family', 'Roboto Mono');

                svg.on('mouseover', function () {
                    d3.select(this)
                        .selectAll('path, line')
                        .attr('stroke', 'var(--accent1)');

                    d3.select(this)
                        .selectAll('text')
                        .attr('fill', 'var(--accent1)');
                }).on('mouseout', function () {
                    d3.select(this)
                        .selectAll('path, line')
                        .attr('stroke', axisColor);

                    d3.select(this).selectAll('text').attr('fill', textColor);
                });
                d3LinearAxisJoin(svg, [data]).call(yAxis);
            });
        }

        renderCanvasArray([d3YaxisRef]);
    }, [scale, d3YaxisRef]);

    return (
        <d3fc-svg
            ref={d3YaxisRef}
            style={{
                gridColumnStart: 1,
                gridColumnEnd: 2,
                gridRowStart: 1,
                gridRowEnd: 3,
            }}
        ></d3fc-svg>
    );
}
