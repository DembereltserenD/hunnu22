import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityTable, ColumnDef } from '../entity-table';

// Mock the UI components
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, className, ...props }: any) => (
        <button onClick={onClick} className={className} {...props}>
            {children}
        </button>
    ),
}));

vi.mock('@/components/ui/input', () => ({
    Input: ({ onChange, value, placeholder, className, ...props }: any) => (
        <input
            onChange={onChange}
            value={value}
            placeholder={placeholder}
            className={className}
            {...props}
        />
    ),
}));

vi.mock('@/components/ui/table', () => ({
    Table: ({ children }: any) => <table>{children}</table>,
    TableBody: ({ children }: any) => <tbody>{children}</tbody>,
    TableCell: ({ children, colSpan }: any) => <td colSpan={colSpan}>{children}</td>,
    TableHead: ({ children }: any) => <th>{children}</th>,
    TableHeader: ({ children }: any) => <thead>{children}</thead>,
    TableRow: ({ children }: any) => <tr>{children}</tr>,
}));

vi.mock('@/components/ui/card', () => ({
    Card: ({ children, className }: any) => <div className={className}>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/pagination', () => ({
    Pagination: ({ children }: any) => <nav>{children}</nav>,
    PaginationContent: ({ children }: any) => <div>{children}</div>,
    PaginationEllipsis: () => <span>...</span>,
    PaginationItem: ({ children }: any) => <div>{children}</div>,
    PaginationLink: ({ children, onClick, isActive }: any) => (
        <button onClick={onClick} className={isActive ? 'active' : ''}>
            {children}
        </button>
    ),
    PaginationNext: ({ onClick, className }: any) => (
        <button onClick={onClick} className={className}>
            Next
        </button>
    ),
    PaginationPrevious: ({ onClick, className }: any) => (
        <button onClick={onClick} className={className}>
            Previous
        </button>
    ),
}));

vi.mock('@/components/ui/loading-spinner', () => ({
    LoadingSpinner: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
}));

vi.mock('@/hooks/use-debounced-search', () => ({
    useDebounceSearch: (initialValue: string) => ({
        searchValue: initialValue,
        debouncedValue: initialValue,
        isSearching: false,
        updateSearchValue: vi.fn(),
        clearSearch: vi.fn(),
    }),
}));

interface TestEntity {
    id: string;
    name: string;
    email: string;
}

const mockData: TestEntity[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

const mockColumns: ColumnDef<TestEntity>[] = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
];

describe('EntityTable', () => {
    const defaultProps = {
        data: mockData,
        columns: mockColumns,
        title: 'Test Table',
    };

    it('renders table with data correctly', () => {
        render(<EntityTable {...defaultProps} />);

        expect(screen.getByText('Test Table')).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('displays empty message when no data', () => {
        render(<EntityTable {...defaultProps} data={[]} />);

        expect(screen.getByText('No data found')).toBeInTheDocument();
    });

    it('shows loading spinner when loading', () => {
        render(<EntityTable {...defaultProps} loading={true} />);

        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('renders Add New button when onAdd is provided', () => {
        const onAdd = vi.fn();
        render(<EntityTable {...defaultProps} onAdd={onAdd} />);

        const addButton = screen.getByText('Add New');
        expect(addButton).toBeInTheDocument();

        fireEvent.click(addButton);
        expect(onAdd).toHaveBeenCalled();
    });

    it('renders action buttons when onEdit and onDelete are provided', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();

        render(
            <EntityTable
                {...defaultProps}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        );

        expect(screen.getByText('Actions')).toBeInTheDocument();

        const editButtons = screen.getAllByLabelText('Edit');
        const deleteButtons = screen.getAllByLabelText('Delete');

        expect(editButtons).toHaveLength(2);
        expect(deleteButtons).toHaveLength(2);

        fireEvent.click(editButtons[0]);
        expect(onEdit).toHaveBeenCalledWith(mockData[0]);

        fireEvent.click(deleteButtons[1]);
        expect(onDelete).toHaveBeenCalledWith(mockData[1]);
    });

    it('renders search input with correct placeholder', () => {
        render(
            <EntityTable
                {...defaultProps}
                searchPlaceholder="Search workers..."
            />
        );

        expect(screen.getByPlaceholderText('Search workers...')).toBeInTheDocument();
    });
});