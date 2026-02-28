from supabase import create_client, Client

# ✅ STEP 1: Paste YOUR Supabase credentials here
SUPABASE_URL = "https://bbfzvctaltlzkgoxefde.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZnp2Y3RhbHRsemtnb3hlZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2MDMxMywiZXhwIjoyMDg3NDM2MzEzfQ.SH26V09Co3pvZeW9HdOA1sB0s9kA2VfctZjY4BQhVOs"

# ✅ STEP 2: Create client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Connecting to Supabase...")

try:
    # ✅ STEP 3: Test fetch from legal_terms table
    response = supabase.table("legal_terms").select("*").limit(5).execute()

    print("✅ Connection successful!")
    print("Data from legal_terms table:")
    print(response.data)

except Exception as e:
    print("❌ Connection failed!")
    print("Error:", e)

