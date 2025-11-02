import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    ConfirmDialog,
    DeleteConfirmDialog,
    UnsavedChangesDialog
} from '../confirm-dialog';

// Mock UI components
vi.mock('@/components/ui/alert-dialog', () => ({
    AlertDialog: ({ children, open }: any) => (
        open ? <div data-testid="alert-dialog">{children}</div> : null
    ),
    AlertDialogAction: ({ children, onClick, disabled, className }: any) => (
        <button onClick={onClick} disabled={disabled} className={className}>
            {children}
        </button>
    ),
    AlertDialogCancel: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
    AlertDialogContent: ({ children }: any) => <div>{children}</div>,
    AlertDialogDescription: ({ children }: any) => <p>{children}</p>,
    AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
    AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: any) => <h3>{children}</h3>,
}));

describe('ConfirmDialog', () => {
    const defaultProps = {
        isOpen: true,
        onOpenChange: vi.fn(),
        title: 'Confirm Action',
        description: 'Are you sure you want to proceed?',
        onConfirm: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders dialog when open', () => {
        render(<ConfirmDialog {...defaultProps} />);

        expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
        expect(screen.getByText('Confirm Action')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
        render(<ConfirmDialog {...defaultProps} isOpen={false} />);

        expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
    });

    it('renders default buttons', () => {
        render(<ConfirmDialog {...defaultProps} />);

        expect(screen.getByText('Delete')).toBeInTheDocument(); // Default destructive variant
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onConfirm when confirm button is clicked', async () => {
        const onConfirm = vi.fn().mockResolvedValue(undefined);
        render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

        const confirmButton = screen.getByText('Delete');
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(onConfirm).toHaveBeenCalled();
        });
    });

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(onCancel).toHaveBeenCalled();
    });
});

describe('DeleteConfirmDialog', () => {
    const defaultProps = {
        isOpen: true,
        onOpenChange: vi.fn(),
        entityName: 'John Doe',
        entityType: 'Worker',
        onConfirm: vi.fn(),
    };

    it('renders delete confirmation with entity details', () => {
        render(<DeleteConfirmDialog {...defaultProps} />);

        expect(screen.getByText('Delete Worker')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to delete "John Doe"/)).toBeInTheDocument();
    });
});

describe('UnsavedChangesDialog', () => {
    const defaultProps = {
        isOpen: true,
        onOpenChange: vi.fn(),
        onConfirm: vi.fn(),
    };

    it('renders unsaved changes warning', () => {
        render(<UnsavedChangesDialog {...defaultProps} />);

        expect(screen.getByText('Unsaved Changes')).toBeInTheDocument();
        expect(screen.getByText(/You have unsaved changes/)).toBeInTheDocument();
    });
});