import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('Employees count:', data.length);
    if (data.length === 0) {
        console.log('Seeding employees...');
        const { data: depts } = await supabase.from('departments').select('id');
        const deptId = depts && depts.length > 0 ? depts[0].id : null;
        if (!deptId) {
            console.log('No departments found. Please seed departments first.');
            return;
        }
        const { error: insertError } = await supabase.from('employees').insert([
            {
                name: 'Alice Smith',
                email: 'alice@example.com',
                phone: '123456789',
                department: deptId,
                job_title: 'Software Engineer',
                monthly_salary: 5000,
                national_id: '1234567890',
                work_hours: 8,
                is_archived: false,
            },
            {
                name: 'Bob Johnson',
                email: 'bob@example.com',
                phone: '987654321',
                department: deptId,
                job_title: 'Product Manager',
                monthly_salary: 6000,
                national_id: '0987654321',
                work_hours: 8,
                is_archived: false,
            },
            {
                name: 'Charlie Brown',
                email: 'charlie@example.com',
                phone: '555555555',
                department: deptId,
                job_title: 'Designer',
                monthly_salary: 4500,
                national_id: '1111111111',
                work_hours: 8,
                is_archived: false,
            }
        ]);
        if (insertError) {
            console.error('Insert Error:', insertError);
        } else {
            console.log('Seeded 3 employees successfully.');
        }
    }
}
check();
