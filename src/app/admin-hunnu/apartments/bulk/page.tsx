import { Suspense } from 'react';
import { getApartmentsForSelect, getWorkersForSelect } from '../../phone-issues/actions';
import { getBuildingsForSelect } from '../../apartments/actions';
import { BulkPhoneIssueForm } from '@/components/admin/bulk-phone-issue-form';

export const dynamic = 'force-dynamic';

export default async function BulkImportApartmentsPage() {
    const [apartments, workers, buildings] = await Promise.all([
        getApartmentsForSelect(),
        getWorkersForSelect(),
        getBuildingsForSelect()
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Bulk Import Apartment Data</h1>
                <p className="text-muted-foreground mt-2">
                    Import apartment maintenance data using codes like: 222-106-2SD 99090909 or 222-901-3SD
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    This will record how many smoke detectors, domophones, or light bulbs were cleaned in each apartment. Buildings must already exist.
                </p>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
                <BulkPhoneIssueForm apartments={apartments} workers={workers} buildings={buildings} />
            </Suspense>
        </div>
    );
}