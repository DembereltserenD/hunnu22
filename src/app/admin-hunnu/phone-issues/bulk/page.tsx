import { Suspense } from 'react';
import { getApartmentsForSelect, getWorkersForSelect } from '../actions';
import { BulkPhoneIssueForm } from '@/components/admin/bulk-phone-issue-form';

export default async function BulkPhoneIssuesPage() {
    const [apartments, workers] = await Promise.all([
        getApartmentsForSelect(),
        getWorkersForSelect()
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Bulk Import Phone Issues</h1>
                <p className="text-muted-foreground mt-2">
                    Import multiple phone issues at once using text format like: 222-1006-3SD 99354845
                </p>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
                <BulkPhoneIssueForm apartments={apartments} workers={workers} />
            </Suspense>
        </div>
    );
}