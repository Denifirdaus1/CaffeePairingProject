import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrashIcon } from './icons/TrashIcon';
import { Spinner } from './Spinner';
import { Toast } from './Toast';
import { DownloadIcon } from './icons/DownloadIcon';

interface Pairing {
  id: string;
  coffee_id: string;
  pastry_id: string;
  score: number;
  why: string;
  status: string;
  is_approved: boolean;
  approved_at?: string;
  is_published?: boolean;
  published_at?: string;
  pairing_slug?: string;
  qr_code_url?: string;
  pdf_url?: string;
  coffees: {
    id: string;
    name: string;
    image_url?: string;
  };
  pastries: {
    id: string;
    name: string;
    image_url?: string;
  };
}

interface ApprovalWorkflowProps {
  pairings: Pairing[];
  onApprovalChange: () => void;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  pairings,
  onApprovalChange
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleApprove = async (pairingId: string) => {
    setLoading(pairingId);
    try {
      // Generate unique slug for pairing
      const pairing = pairings.find(p => p.id === pairingId);
      if (!pairing) throw new Error('Pairing not found');
      
      const slug = `${pairing.coffees.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${pairing.pastries.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${pairingId.substring(0, 8)}`;
      
      const { error } = await supabase
        .from('pairings')
        .update({
          is_approved: true,
          approved_at: new Date().toISOString(),
          pairing_slug: slug
        })
        .eq('id', pairingId);

      if (error) throw error;

      setToast({ message: 'Pairing approved successfully!', type: 'success' });
      onApprovalChange();
    } catch (error) {
      console.error('Error approving pairing:', error);
      setToast({ message: 'Failed to approve pairing', type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (pairingId: string) => {
    setLoading(pairingId);
    try {
      const { error } = await supabase
        .from('pairings')
        .update({
          is_approved: false,
          approved_at: null
        })
        .eq('id', pairingId);

      if (error) throw error;

      setToast({ message: 'Pairing rejected', type: 'success' });
      onApprovalChange();
    } catch (error) {
      console.error('Error rejecting pairing:', error);
      setToast({ message: 'Failed to reject pairing', type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (pairingId: string) => {
    if (!confirm('Are you sure you want to delete this pairing? This action cannot be undone.')) {
      return;
    }

    setLoading(pairingId);
    try {
      const { error } = await supabase
        .from('pairings')
        .delete()
        .eq('id', pairingId);

      if (error) throw error;

      setToast({ message: 'Pairing deleted successfully', type: 'success' });
      onApprovalChange();
    } catch (error) {
      console.error('Error deleting pairing:', error);
      setToast({ message: 'Failed to delete pairing', type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const handlePublishAndDownload = async (pairingId: string) => {
    setLoading(pairingId);
    try {
      const pairing = pairings.find(p => p.id === pairingId);
      if (!pairing) throw new Error('Pairing not found');
      
      // Update pairing to published
      const { error: updateError } = await supabase
        .from('pairings')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', pairingId);

      if (updateError) throw updateError;

      // Generate PDF with QR code
      const pdfUrl = await generatePairingPDF(pairing);
      
      // Update PDF URL in database
      const { error: urlError } = await supabase
        .from('pairings')
        .update({ pdf_url: pdfUrl })
        .eq('id', pairingId);

      if (urlError) console.error('Error updating PDF URL:', urlError);

      setToast({ message: 'Pairing published and PDF downloaded!', type: 'success' });
      onApprovalChange();
    } catch (error) {
      console.error('Error publishing pairing:', error);
      setToast({ message: 'Failed to publish pairing', type: 'error' });
    } finally {
      setLoading(null);
    }
  };

  const generatePairingPDF = async (pairing: any) => {
    // This will call the download service to generate PDF with QR code
    // For now, return a placeholder URL
    const publicUrl = window.location.origin;
    const qrUrl = `${publicUrl}/s/${pairing.pairing_slug}`;
    
    // Import the download service dynamically
    const { downloadPDF } = await import('../services/downloadService');
    
    // Generate pairing response format
    const pairingData = {
      coffee: {
        id: pairing.coffees.id,
        name: pairing.coffees.name,
        image: pairing.coffees.image_url || ''
      },
      pairs: [{
        pastry: {
          id: pairing.pastries.id,
          name: pairing.pastries.name,
          image: pairing.pastries.image_url || ''
        },
        score: pairing.score,
        score_breakdown: {
          flavor: 0.7,
          texture: 0.7,
          popularity: 0.7,
          season: 0.7
        },
        reasoning: {
          flavor: 'Flavor compatibility explanation',
          texture: 'Texture balance explanation',
          popularity: 'Popularity match explanation',
          season: 'Seasonal relevance explanation'
        },
        why_marketing: pairing.why || 'Perfect pairing!',
        facts: [{
          summary: pairing.why || 'Perfect pairing discovered',
          source_url: 'https://bunamo-model.com'
        }],
        badges: ['Approved', 'Published'],
        flavor_tags_standardized: ['Premium', 'Balanced'],
        allergen_info: 'Check ingredients'
      }],
      ui: {
        layout: 'cards',
        show_downloads: ['pdf'],
        notes: 'AI-powered pairing recommendation'
      }
    };
    
    // Generate and download PDF with QR code
    downloadPDF(pairingData, qrUrl);
    
    // Return a placeholder URL (in production, this would be the uploaded PDF URL)
    return `${publicUrl}/pairing-${pairing.id}.pdf`;
  };

  const pendingPairings = pairings.filter(p => !p.is_approved);
  const approvedPairings = pairings.filter(p => p.is_approved);

  return (
    <div className="space-y-8">
      {/* Pending Approvals */}
      {pendingPairings.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            Pending Approvals ({pendingPairings.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingPairings.map((pairing) => (
              <div key={pairing.id} className="glass-panel rounded-2xl p-6 border-2 border-yellow-400/30">
                <div className="flex items-center gap-4 mb-4">
                  {/* Coffee Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {pairing.coffees.image_url ? (
                      <img
                        src={pairing.coffees.image_url}
                        alt={pairing.coffees.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-surface flex items-center justify-center">
                        <span className="text-brand-text-muted text-xs">☕</span>
                      </div>
                    )}
                  </div>

                  {/* Pastry Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {pairing.pastries.image_url ? (
                      <img
                        src={pairing.pastries.image_url}
                        alt={pairing.pastries.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-surface flex items-center justify-center">
                        <span className="text-brand-text-muted text-xs">🥐</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {pairing.coffees.name} + {pairing.pastries.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-brand-text-muted">Score:</span>
                    <span className="text-brand-accent font-bold">
                      {Math.round(pairing.score * 100)}%
                    </span>
                  </div>
                  {pairing.why && (
                    <p className="text-sm text-brand-text-muted line-clamp-2">
                      {pairing.why}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(pairing.id)}
                    disabled={loading === pairing.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {loading === pairing.id ? (
                      <Spinner />
                    ) : (
                      <CheckCircleIcon className="h-4 w-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(pairing.id)}
                    disabled={loading === pairing.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {loading === pairing.id ? (
                      <Spinner />
                    ) : (
                      <span>✕</span>
                    )}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Pairings */}
      {approvedPairings.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            Approved Pairings ({approvedPairings.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedPairings.map((pairing) => (
              <div key={pairing.id} className="glass-panel rounded-2xl p-6 border-2 border-green-400/30">
                <div className="flex items-center gap-4 mb-4">
                  {/* Coffee Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {pairing.coffees.image_url ? (
                      <img
                        src={pairing.coffees.image_url}
                        alt={pairing.coffees.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-surface flex items-center justify-center">
                        <span className="text-brand-text-muted text-xs">☕</span>
                      </div>
                    )}
                  </div>

                  {/* Pastry Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    {pairing.pastries.image_url ? (
                      <img
                        src={pairing.pastries.image_url}
                        alt={pairing.pastries.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-surface flex items-center justify-center">
                        <span className="text-brand-text-muted text-xs">🥐</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {pairing.coffees.name} + {pairing.pastries.name}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-brand-text-muted">Score:</span>
                    <span className="text-brand-accent font-bold">
                      {Math.round(pairing.score * 100)}%
                    </span>
                    <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Approved
                    </span>
                  </div>
                  {pairing.why && (
                    <p className="text-sm text-brand-text-muted line-clamp-2">
                      {pairing.why}
                    </p>
                  )}
                  {pairing.approved_at && (
                    <p className="text-xs text-brand-text-muted mt-2">
                      Approved: {new Date(pairing.approved_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handlePublishAndDownload(pairing.id)}
                    disabled={loading === pairing.id}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-accent to-amber-400 hover:from-brand-accent/90 hover:to-amber-400/90 disabled:from-brand-accent/50 disabled:to-amber-400/50 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                  >
                    {loading === pairing.id ? (
                      <Spinner />
                    ) : (
                      <DownloadIcon className="h-4 w-4" />
                    )}
                    {pairing.is_published ? 'Re-download PDF' : 'Publish & Download PDF'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(pairing.id)}
                      disabled={loading === pairing.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {loading === pairing.id ? (
                        <Spinner />
                      ) : (
                        <span>↩</span>
                      )}
                      Unapprove
                    </button>
                    <button
                      onClick={() => handleDelete(pairing.id)}
                      disabled={loading === pairing.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {loading === pairing.id ? (
                        <Spinner />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {pairings.length === 0 && (
        <div className="text-center py-12">
          <div className="glass-panel rounded-2xl p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-brand-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">☕</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Pairings Yet</h3>
            <p className="text-brand-text-muted">
              Generate some coffee-pastry pairings to see them here for approval.
            </p>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
