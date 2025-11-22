-- Add smoke detector loop and address fields to apartments table
ALTER TABLE apartments 
ADD COLUMN IF NOT EXISTS smoke_detector_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS smoke_detector_loops TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS smoke_detector_addresses TEXT[] DEFAULT '{}';

-- Add comment to explain the fields
COMMENT ON COLUMN apartments.smoke_detector_count IS 'Total number of smoke detectors in the unit';
COMMENT ON COLUMN apartments.smoke_detector_loops IS 'Array of loop numbers for each smoke detector (e.g., {4, 4, 4} for 3 detectors on loop 4)';
COMMENT ON COLUMN apartments.smoke_detector_addresses IS 'Array of address numbers for each smoke detector (e.g., {25, 26, 27})';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_apartments_smoke_detector_count ON apartments(smoke_detector_count);
