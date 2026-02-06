import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import type { PageNode, PageLink } from '../api/sitemap';
import './SitemapGraph.css';

interface SitemapGraphProps {
  nodes: PageNode[];
  links: PageLink[];
  onNodeClick?: (node: PageNode) => void;
}

interface D3Node extends d3.SimulationNodeDatum, PageNode {}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: D3Node | string;
  target: D3Node | string;
}

export function SitemapGraph({ nodes, links, onNodeClick }: SitemapGraphProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Container for zooming/panning
    const container = svg.append('g');

    // Add glow filter
    const defs = svg.append('defs');
    
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow marker for directed edges
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#00cc7f');

    // Prepare data for D3
    const d3Nodes: D3Node[] = nodes.map((n) => ({ ...n }));
    const nodeMap = new Map(d3Nodes.map((n) => [n.id, n]));
    
    const d3Links: D3Link[] = links
      .filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map((l) => ({
        source: l.source,
        target: l.target,
      }));

    // Create simulation
    const simulation = d3.forceSimulation<D3Node>(d3Nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(d3Links)
        .id((d) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Draw links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(d3Links)
      .join('line')
      .attr('class', 'link')
      .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(d3Nodes)
      .join('circle')
      .attr('class', 'node')
      .attr('r', (d) => Math.max(6, Math.min(15, 5 + d.outgoing_links)))
      .attr('fill', (d) => {
        if (d.depth === 0) return '#ffb300'; // Root node amber
        const intensity = 1 - (d.depth / 4);
        return d3.interpolateRgb('#00ff9f', '#004d30')(1 - intensity);
      })
      .attr('filter', 'url(#glow)')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          const originalNode = nodes.find((n) => n.id === d.id);
          if (originalNode) onNodeClick(originalNode);
        }
      })
      .call(d3.drag<SVGCircleElement, D3Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Node labels (URL truncated)
    const labels = container.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(d3Nodes)
      .join('text')
      .attr('class', 'node-label')
      .text((d) => {
        try {
          const url = new URL(d.url);
          const path = url.pathname.length > 20 
            ? url.pathname.slice(0, 20) + '...' 
            : url.pathname;
          return path || '/';
        } catch {
          return d.url.slice(0, 20);
        }
      });

    // Tooltip
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'graph-tooltip')
      .style('opacity', 0);

    node
      .on('mouseenter', (event, d) => {
        tooltip
          .style('opacity', 1)
          .html(`
            <div class="tooltip-title">${d.title || 'No title'}</div>
            <div class="tooltip-url">${d.url}</div>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseleave', () => {
        tooltip.style('opacity', 0);
      });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x!)
        .attr('y1', (d) => (d.source as D3Node).y!)
        .attr('x2', (d) => (d.target as D3Node).x!)
        .attr('y2', (d) => (d.target as D3Node).y!);

      node
        .attr('cx', (d) => d.x!)
        .attr('cy', (d) => d.y!);

      labels
        .attr('x', (d) => d.x! + 12)
        .attr('y', (d) => d.y! + 4);
    });

    // Cleanup
    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [nodes, links, dimensions, onNodeClick]);

  return (
    <div className="graph-container" ref={containerRef}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
      <div className="graph-hint">
        {t('graph.zoom')}
      </div>
    </div>
  );
}
