CREATE OR REPLACE FUNCTION auto_set_floor_from_unit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unit_number IS NOT NULL AND NEW.unit_number ~ '^\d+$' THEN
    IF LENGTH(NEW.unit_number) >= 3 THEN
      NEW.floor := SUBSTRING(NEW.unit_number FROM 1 FOR LENGTH(NEW.unit_number) - 2)::INTEGER;
    ELSE
      NEW.floor := 1;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_floor_before_insert ON apartments;
CREATE TRIGGER set_floor_before_insert
  BEFORE INSERT OR UPDATE ON apartments
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_floor_from_unit();
