# Test transformations and default seed data
demo_rundowns = [
    { "id": "r-1", "start_time": "06:30 - 07:30", "title": "Kumpul di Kantor & Registrasi Peserta", "location": "Lobby Gedung Utama", "description": "Briefing", "order_index": 1 },
    { "id": "r-2", "start_time": "07:30 - 10:30", "title": "Perjalanan Bus Menuju Puncak", "location": "Tol Jagorawi", "description": "Bus tour", "order_index": 2 }
]

demo_finance = [
    { "id": "f-1", "type": "IN", "amount": 35000000, "category": "Iuran", "description": "70 peserta", "transaction_date": "2026-09-10", "status": "POSTED" },
    { "id": "f-2", "type": "OUT", "amount": 12000000, "category": "Villa", "description": "DP Villa", "transaction_date": "2026-09-13", "status": "POSTED" }
]

demo_purchasing = [
    { "id": "p-1", "item_name": "Kaos Polo", "quantity": 85, "unit": "Pcs", "estimated_cost": 4500000, "actual_cost": 4250000, "vendor": "Konveksi", "needed_date": "2026-10-05", "section": "LOGISTIC", "status": "COMPLETED", "notes": "Navy" }
]

demo_tasks = [
    { "id": "t-1", "title": "Booking Bus", "priority": "HIGH", "deadline": "2026-10-10", "status": "DONE", "progress": 100, "assigned_to": "Hendra", "notes": "Siap" }
]

demo_consumptions = [
    { "id": "c-1", "date": "2026-10-15", "meal_type": "SNACK_PAGI", "location": "Bus", "participant_count": 85, "vendor": "Bu Ani", "estimated_cost": 1275000, "actual_cost": 1275000, "status": "ORDERED", "notes": "Lemper" }
]

demo_announcements = [
    { "id": "a-1", "title": "Dresscode", "content": "Kaos biru", "priority": "HIGH", "publish_date": "2026-09-18" }
]

demo_participants = [
    { "id": "pt-1", "username": "admin", "full_name": "Budi Santoso", "phone": "081234567890", "department": "Management", "gender": "L", "transport": "Mobil", "room": "Villa Utama", "status": "CONFIRMED" }
]

print("All sample data defined successfully.")
print(f"Rundowns: {len(demo_rundowns)}")
print(f"Finance: {len(demo_finance)}")
print(f"Purchasing: {len(demo_purchasing)}")
print(f"Tasks: {len(demo_tasks)}")
print(f"Consumptions: {len(demo_consumptions)}")
print(f"Announcements: {len(demo_announcements)}")
print(f"Participants: {len(demo_participants)}")
