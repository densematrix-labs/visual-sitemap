import { useTranslation } from 'react-i18next';
import { X, ExternalLink } from 'lucide-react';
import type { PageNode } from '../api/sitemap';
import './NodeDetails.css';

interface NodeDetailsProps {
  node: PageNode | null;
  onClose: () => void;
}

export function NodeDetails({ node, onClose }: NodeDetailsProps) {
  const { t } = useTranslation();

  if (!node) return null;

  return (
    <div className="node-details">
      <div className="node-details-header">
        <span className="node-details-title">NODE_INFO</span>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
      </div>
      
      <div className="node-details-content">
        <div className="detail-row">
          <span className="detail-label">{t('node.title')}</span>
          <span className="detail-value">{node.title || '—'}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('node.url')}</span>
          <a 
            href={node.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="detail-value url-value"
          >
            {node.url}
            <ExternalLink size={12} />
          </a>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('node.depth')}</span>
          <span className="detail-value number">{node.depth}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('node.outgoing')}</span>
          <span className="detail-value number text-phosphor">{node.outgoing_links}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">{t('node.incoming')}</span>
          <span className="detail-value number text-amber">{node.incoming_links}</span>
        </div>
      </div>
    </div>
  );
}
