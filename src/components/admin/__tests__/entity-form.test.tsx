import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityForm, FormFieldConfig, createWorkerFormFields } from '../entity-form';
import { z } from 'zod';

// Mock react-hook-form
const mockUseForm = {
    control: {},
    handleSubmit: vi.fn((fn) => (e: any) => {
        e.preventDefault();
        fn({ name: 'Test Name', email: 'test@example.com' });
    }),
    setError: vi.fn(),
};

vi.mock('react-hook-form', () => ({
    useForm: () => mockUseForm,
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, type, ...props }: any) => (
        <button onClick={onClick} disabled={disabled} type={type} {...props}>
            {children}
        </button>
    ),
}));

vi.mock('@/components/ui/input', () => ({
    Input: ({ onChange, value, placeholder, disabled, type, ...props }: any) => (
        <input
            onChange={onChange}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            type={type}
            {...props}
        />
    ),
}));

vi.mock('@/components/ui/form', () => ({
    Form: ({ children }: any) => <div>{children}</div>,
    FormControl: ({ children }: any) => <div>{children}</div>,
    FormField: ({ render, name }: any) => {
        const field = { onChange: vi.fn(), value: '' };
        return render({ field });
    },
    FormItem: ({ children }: any) => <div>{children}</div>,
    FormLabel: ({ children }: any) => <label>{children}</label>,
    FormMessage: () => <div data-testid="form-message"></div>,
}));

vi.mock('@/components/ui/card', () => ({
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

describe('EntityForm', () => {
    const mockFields: FormFieldConfig[] = [
        {
            name: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Enter name',
            required: true,
        },
        {
            name: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'Enter email',
        },
    ];

    const defaultProps = {
        title: 'Test Form',
        fields: mockFields,
        onSubmit: vi.fn(),
        onCancel: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders form with title and fields', () => {
        render(<EntityForm {...defaultProps} />);

        expect(screen.getByText('Test Form')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
        render(<EntityForm {...defaultProps} />);

        expect(screen.getByText('Save')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onSubmit when form is submitted', async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(<EntityForm {...defaultProps} onSubmit={onSubmit} />);

        const submitButton = screen.getByText('Save');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                name: 'Test Name',
                email: 'test@example.com',
            });
        });
    });

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<EntityForm {...defaultProps} onCancel={onCancel} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(onCancel).toHaveBeenCalled();
    });
});

describe('Form Field Helpers', () => {
    it('creates worker form fields correctly', () => {
        const fields = createWorkerFormFields();

        expect(fields).toHaveLength(3);
        expect(fields[0]).toEqual({
            name: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Enter worker name',
            required: true,
        });
    });
});