import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seed() {
    const { data: ext, error: fetchErr } = await supabase.from('departments').select('id');
    if (fetchErr) {
        console.error('Fetch departments error:', fetchErr);
        return;
    }

    if (ext.length === 0) {
        console.log('Seeding departments...');
        const { data: hrDept, error: hrErr } = await supabase.from('departments').insert({
            name: 'Human Resources',
            type: 'structural',
            color_palette: 'blue'
        }).select().single();

        if (hrErr) {
            console.error('HR error:', hrErr);
            return;
        }

        const { data: subDept, error: subErr } = await supabase.from('departments').insert({
            name: 'Recruitment',
            type: 'functional',
            parent_id: hrDept.id
        }).select().single();

        if (subErr) {
            console.error('Sub error:', subErr);
            return;
        }
    }

    console.log('Departments exist. Seeding employees...');

    const { data: functionals } = await supabase.from('departments').select('id').eq('type', 'functional');
    if (!functionals || functionals.length === 0) return;

    const deptId = functionals[0].id;

    const { data: emps } = await supabase.from('employees').select('id');
    if (emps && emps.length === 0) {
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
    } else {
        console.log('Employees already exist.');
    }

}

seed();
