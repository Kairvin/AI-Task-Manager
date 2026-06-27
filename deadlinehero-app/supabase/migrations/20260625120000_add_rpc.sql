CREATE OR REPLACE FUNCTION get_workspace_members_details(ws_id UUID)
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    email TEXT,
    full_name TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wm.user_id,
        wm.role,
        au.email::text,
        (au.raw_user_meta_data->>'full_name')::text
    FROM workspace_members wm
    JOIN auth.users au ON wm.user_id = au.id
    WHERE wm.workspace_id = ws_id;
END;
$$ LANGUAGE plpgsql;
