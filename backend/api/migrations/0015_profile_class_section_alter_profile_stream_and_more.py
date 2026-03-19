
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_alter_user_options_user_created_at_user_updated_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='class_section',
            field=models.CharField(blank=True, default='', help_text="Optional section label within the base class. Created by admin when needed (e.g. 'A', 'B'). Does not affect subject enrollment.", max_length=10),
        ),
        migrations.AlterField(
            model_name='profile',
            name='stream',
            field=models.CharField(blank=True, choices=[('science', 'Science'), ('arts', 'Arts / Humanities'), ('commercial', 'Commercial / Business'), ('technical', 'Technical / Vocational'), ('general', 'General')], help_text='Science / Arts / Commercial stream — SSS students only.', max_length=15, null=True),
        ),
        migrations.AlterField(
            model_name='profile',
            name='student_class',
            field=models.CharField(blank=True, choices=[('jss1', 'JSS 1'), ('jss2', 'JSS 2'), ('jss3', 'JSS 3'), ('sss1_sci', 'SSS 1 Science'), ('sss1_arts', 'SSS 1 Arts'), ('sss1_com', 'SSS 1 Commercial'), ('sss2_sci', 'SSS 2 Science'), ('sss2_arts', 'SSS 2 Arts'), ('sss2_com', 'SSS 2 Commercial'), ('sss3_sci', 'SSS 3 Science'), ('sss3_arts', 'SSS 3 Arts'), ('sss3_com', 'SSS 3 Commercial'), ('ibtidaai_1', 'الصف الأول الابتدائي'), ('ibtidaai_2', 'الصف الثاني الابتدائي'), ('ibtidaai_3', 'الصف الثالث الابتدائي'), ('ibtidaai_4', 'الصف الرابع الابتدائي'), ('ibtidaai_5', 'الصف الخامس الابتدائي'), ('ibtidaai_6', 'الصف السادس الابتدائي'), ('mutawassit_1', 'الصف الأول المتوسط'), ('mutawassit_2', 'الصف الثاني المتوسط'), ('mutawassit_3', 'الصف الثالث المتوسط'), ('thanawi_1', 'الصف الأول الثانوي'), ('thanawi_2', 'الصف الثاني الثانوي'), ('thanawi_3', 'الصف الثالث الثانوي'), ('ai_ml_beginner', 'AI & ML — Beginner'), ('ai_ml_junior', 'AI & ML — Junior'), ('ai_ml_intermediate', 'AI & ML — Intermediate'), ('ai_ml_advanced', 'AI & ML — Advanced'), ('data_science_beginner', 'Data Science — Beginner'), ('data_science_junior', 'Data Science — Junior'), ('data_science_intermediate', 'Data Science — Intermediate'), ('data_science_advanced', 'Data Science — Advanced'), ('scratch_beginner', 'Scratch — Beginner'), ('scratch_junior', 'Scratch — Junior'), ('scratch_intermediate', 'Scratch — Intermediate'), ('scratch_advanced', 'Scratch — Advanced'), ('frontend_beginner', 'Frontend — Beginner'), ('frontend_junior', 'Frontend — Junior'), ('frontend_intermediate', 'Frontend — Intermediate'), ('frontend_advanced', 'Frontend — Advanced'), ('backend_beginner', 'Backend — Beginner'), ('backend_junior', 'Backend — Junior'), ('backend_intermediate', 'Backend — Intermediate'), ('backend_advanced', 'Backend — Advanced'), ('ai_automation_beginner', 'AI Automation — Beginner'), ('ai_automation_junior', 'AI Automation — Junior'), ('ai_automation_intermediate', 'AI Automation — Intermediate'), ('ai_automation_advanced', 'AI Automation — Advanced')], db_index=True, help_text='Base class code.  Sections (A, B, C) are stored in class_section. Auto-enrollment triggers on this field.', max_length=40, null=True),
        ),
        migrations.AlterField(
            model_name='profile',
            name='teacher_type',
            field=models.CharField(blank=True, choices=[('class', 'Class Teacher'), ('subject', 'Subject Teacher')], help_text='Only relevant when role=teacher.', max_length=20, null=True),
        ),
        migrations.AlterField(
            model_name='subjectassignment',
            name='subject',
            field=models.CharField(choices=[('core', ' ── Core / Compulsory ──'), ('english_language', 'English Language'), ('mathematics', 'Mathematics'), ('civic_education', 'Civic Education'), ('digital_technologies', 'Digital Technologies / Computer Studies'), ('citizenship_heritage', 'Citizenship and Heritage Studies'), ('entrepreneurship', 'Trade / Entrepreneurship Subject'), ('science', 'Science'), ('biology', 'Biology'), ('chemistry', 'Chemistry'), ('physics', 'Physics'), ('further_mathematics', 'Further Mathematics'), ('agricultural_science', 'Agricultural Science'), ('geography', 'Geography'), ('technical_drawing', 'Technical Drawing'), ('food_nutrition', 'Food and Nutrition'), ('health_education', 'Health Education'), ('physical_health_education', 'Physical and Health Education'), ('arts', 'Humanities / Art'), ('literature_in_english', 'Literature in English'), ('government', 'Government'), ('nigerian_history', 'Nigerian History'), ('christian_religious_studies', 'Christian Religious Studies (CRS)'), ('islamic_religious_studies', 'Islamic Religious Studies (IRS)'), ('visual_arts', 'Visual Arts (Fine Arts)'), ('music', 'Music'), ('french', 'French'), ('arabic', 'Arabic'), ('hausa', 'Hausa'), ('igbo', 'Igbo'), ('yoruba', 'Yoruba'), ('home_management', 'Home Management'), ('catering_craft', 'Catering Craft'), ('commercial', 'Commercial / Business'), ('financial_accounting', 'Financial Accounting'), ('commerce', 'Commerce'), ('economics', 'Economics'), ('marketing', 'Marketing'), ('business_studies', 'Business Studies'), ('technical', 'Technology / Technical'), ('basic_electronics', 'Basic Electronics'), ('basic_electricity', 'Basic Electricity'), ('metalwork', 'Metalwork'), ('woodwork', 'Woodwork'), ('building_construction', 'Building Construction'), ('auto_mechanics', 'Auto Mechanics'), ('welding_fabrication', 'Welding and Fabrication'), ('computer_studies_ict', 'Computer Studies / ICT'), ('jss', 'JSS General'), ('basic_science', 'Basic Science'), ('basic_technology', 'Basic Technology'), ('social_studies', 'Social Studies'), ('cultural_creative_arts', 'Cultural and Creative Arts'), ('religious_studies', 'Religious Studies (General)')], db_index=True, max_length=50),
        ),
        migrations.AddIndex(
            model_name='profile',
            index=models.Index(fields=['department', 'student_class'], name='api_profile_departm_e2990b_idx'),
        ),
    ]
