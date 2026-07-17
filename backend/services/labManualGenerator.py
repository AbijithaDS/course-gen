import sys
import os
import json
import re
import copy
import docx
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.table import Table
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_run_font(run, font_name='Times New Roman', size_pt=11, bold=False, italic=False, color_rgb=None):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    if color_rgb:
        run.font.color.rgb = color_rgb

def replace_text_in_runs(paragraphs, placeholder, replacement):
    for p in paragraphs:
        if placeholder in p.text:
            for run in p.runs:
                if placeholder in run.text:
                    run.text = run.text.replace(placeholder, replacement)

def insert_p_after_p(p_ref, text=""):
    p_el = p_ref._element
    new_p_el = OxmlElement('w:p')
    p_el.addnext(new_p_el)
    new_p = docx.text.paragraph.Paragraph(new_p_el, p_ref.part)
    if text:
        new_p.text = text
    return new_p

def insert_tbl_after_p(p_ref, table_el):
    p_el = p_ref._element
    p_el.addnext(table_el)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_background(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def main():
    if len(sys.argv) < 4:
        print("Usage: python labManualGenerator.py <templatePath> <inputPath> <outputPath>")
        sys.exit(1)
        
    template_path = sys.argv[1]
    input_path = sys.argv[2]
    output_path = sys.argv[3]
    
    # 1. Load dynamic input payload
    with open(input_path, 'r', encoding='utf-8') as f:
        payload = json.load(f)
        
    subjectCode = payload.get("subjectCode", "")
    subjectName = payload.get("subjectName", "Academic Subject")
    staffName = payload.get("staffName", "Faculty member")
    departmentName = payload.get("departmentName", "Academic Department")
    year = payload.get("year", "")  # Academic year e.g. 2025-2026
    semester = payload.get("semester", "")
    regulation = payload.get("regulation", "")
    collegeName = payload.get("collegeName", "SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY")
    content_str = payload.get("content", "")
    
    try:
        parsed_content = json.loads(content_str)
    except Exception as parse_err:
        print(f"Error parsing manual JSON content: {parse_err}")
        parsed_content = {"experiments": []}
        
    experiments = parsed_content.get("experiments", [])
    
    # Normalise field names — accept both old (no, bloomsLevel) and new (experimentNo, bloomsTaxonomy)
    def normalise_exp(exp, idx):
        # Experiment number
        exp_no = exp.get("experimentNo") or exp.get("no") or (idx + 1)
        exp["no"] = exp_no
        exp["experimentNo"] = exp_no
        # Bloom's taxonomy
        bloom = exp.get("bloomsTaxonomy") or exp.get("bloomsLevel") or "K3 - Apply"
        exp["bloomsLevel"] = bloom
        exp["bloomsTaxonomy"] = bloom
        # Procedure — ensure it is a list
        proc = exp.get("procedure", [])
        if isinstance(proc, str):
            exp["procedure"] = [s.strip() for s in proc.split("\n") if s.strip()]
        # Program — normalise program/program1
        if not exp.get("program1") and exp.get("program"):
            exp["program1"] = exp["program"]
        return exp

    experiments = [normalise_exp(e, i) for i, e in enumerate(experiments)]

    # Enforce exactly 10 experiments
    if len(experiments) > 10:
        experiments = experiments[:10]
    elif len(experiments) < 10:
        while len(experiments) < 10:
            n = len(experiments) + 1
            experiments.append(normalise_exp({
                "no": n,
                "experimentNo": n,
                "title": f"Experiment {n} - Additional Exercise",
                "aim": "To study and implement additional concepts.",
                "objectives": "Understand concepts.",
                "theory": "Detailed concept theory.",
                "procedure": ["Step 1: Start", "Step 2: Process", "Step 3: End"],
                "program1": "# Additional experiment program",
                "result": "Completed successfully.",
                "bloomsLevel": "K3 - Apply",
                "bloomsTaxonomy": "K3 - Apply",
                "coMapping": "CO5"
            }, n - 1))
            
    # Resolve Even/Odd semester
    is_even = True
    try:
        sem_num = int(re.sub(r"\D", "", str(semester)))
        if sem_num % 2 != 0:
            is_even = False
    except:
        if "ODD" in str(semester).upper():
            is_even = False
            
    sem_type = "EVEN SEMESTER" if is_even else "ODD SEMESTER"
    
    # 2. Open template
    doc = Document(template_path)
    
    # Replace Cover Page and Certificate placeholders in paragraphs
    replace_text_in_runs(doc.paragraphs, "{department}", departmentName.upper())
    replace_text_in_runs(doc.paragraphs, "{Course_Code}", subjectCode)
    replace_text_in_runs(doc.paragraphs, "{Course_name}", subjectName)
    replace_text_in_runs(doc.paragraphs, "{Course_Name}", subjectName)
    replace_text_in_runs(doc.paragraphs, "{academic_Year}", year)
    replace_text_in_runs(doc.paragraphs, "{Even/Odd}", sem_type)
    replace_text_in_runs(doc.paragraphs, "{year}", regulation)
    replace_text_in_runs(doc.paragraphs, "{Regulation}", regulation)
    replace_text_in_runs(doc.paragraphs, "{semester}", semester)
    
    # Update College Name globally if exists in runs
    for p in doc.paragraphs:
        if "SRI SHANMUGHA COLLEGE" in p.text.upper():
            for run in p.runs:
                if "SRI SHANMUGHA" in run.text:
                    run.text = run.text.replace("SRI SHANMUGHA COLLEGE OF ENGINEERING AND TECHNOLOGY", collegeName.upper())
                    
    # 3. Update Table of Contents (Table 0)
    toc_table = doc.tables[0]
    
    for idx, exp in enumerate(experiments):
        row_idx = idx + 1
        if row_idx < len(toc_table.rows):
            row = toc_table.rows[row_idx]
            row.cells[0].text = str(exp.get("experimentNo") or exp.get("no") or (idx + 1))
            row.cells[2].text = exp.get("title", "")
        else:
            # Dynamically add row to Table of Contents
            new_row = toc_table.add_row()
            new_row.cells[0].text = str(exp.get("experimentNo") or exp.get("no") or (idx + 1))
            new_row.cells[2].text = exp.get("title", "")
            
        # Format the TOC row text
        for cell in toc_table.rows[row_idx].cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    set_run_font(run, font_name='Times New Roman', size_pt=10.5)
                    
    # 4. Populate Detailed Experiments
    is_computing = any(x in departmentName.upper() for x in ["CSE", "CS", "IT", "AIDS", "AI", "CYBER"])
    green_color = RGBColor(21, 128, 61)
    
    for i in range(10):
        exp = experiments[i]
        
        # Check if table exists in template
        table_idx = i + 1
        if table_idx < len(doc.tables):
            exp_table = doc.tables[table_idx]
        else:
            # Duplicate the last table (which is Table 9 at index len(tables)-1)
            ref_table = doc.tables[-1]
            ref_element = ref_table._element
            new_table_element = copy.deepcopy(ref_element)
            
            # Find the paragraph before this table to insert a page break
            p_break = doc.add_paragraph()
            p_break.add_run().add_break(docx.enum.text.WD_BREAK.PAGE)
            ref_element.addnext(p_break._element)
            p_break._element.addnext(new_table_element)
            
            # Wrap the new element in docx Table object
            exp_table = Table(new_table_element, doc)
            
        # Fill in header table
        # Cell 1 of row 0 is Title
        cell_title = exp_table.rows[0].cells[1]
        cell_title.text = exp.get("title", "").upper()
        # Cell 1 of row 1 is Date (leave blank)
        cell_date = exp_table.rows[1].cells[1]
        cell_date.text = ""
        
        # Ex No and Date Labels
        exp_table.rows[0].cells[0].text = f"EX NO: {exp.get('experimentNo') or exp.get('no') or (i + 1)}"
        exp_table.rows[1].cells[0].text = "DATE:"
        
        # Format the header table font
        for row in exp_table.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    for run in p.runs:
                        set_run_font(run, font_name='Times New Roman', size_pt=11, bold=True)
                        
        # Now, insert all details sequentially after this table
        tbl_el = exp_table._element
        
        # Helper to insert paragraphs after the table element
        last_el = tbl_el
        
        def add_paragraph_after(text="", bold_lbl="", is_code=False, italic=False, color=None, space_before=12, space_after=4):
            nonlocal last_el
            new_p_el = OxmlElement('w:p')
            last_el.addnext(new_p_el)
            last_el = new_p_el
            
            p = docx.text.paragraph.Paragraph(new_p_el, doc.part)
            p.paragraph_format.space_before = Pt(space_before)
            p.paragraph_format.space_after = Pt(space_after)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            
            if bold_lbl:
                r_lbl = p.add_run(bold_lbl)
                set_run_font(r_lbl, font_name='Times New Roman', size_pt=11, bold=True, color_rgb=color)
                
            if text:
                r_text = p.add_run(text)
                if is_code:
                    set_run_font(r_text, font_name='Consolas', size_pt=9.5, color_rgb=RGBColor(30, 41, 59))
                    p.paragraph_format.left_indent = Inches(0.2)
                else:
                    set_run_font(r_text, font_name='Times New Roman', size_pt=11, italic=italic, color_rgb=color)
                    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                    
            return p
            
        # 1. AIM
        add_paragraph_after(text=exp.get("aim", ""), bold_lbl="AIM:\n", space_before=18)
        
        # 2. OBJECTIVES
        objectives_str = exp.get("objectives", "")
        if isinstance(objectives_str, list):
            objectives_str = "\n".join(objectives_str)
        add_paragraph_after(text=objectives_str, bold_lbl="OBJECTIVES:\n")
        
        # 3. THEORY
        add_paragraph_after(text=exp.get("theory", ""), bold_lbl="THEORY:\n")
        
        # 4. APPARATUS REQUIRED (requires only on core subjects, non-computing)
        if not is_computing:
            apps = exp.get("apparatusRequired", [])
            if apps:
                p_app = add_paragraph_after(bold_lbl="APPARATUS REQUIRED:\n")
                
                # Insert Table after p_app
                tbl = OxmlElement('w:tbl')
                tblPr = OxmlElement('w:tblPr')
                tblStyle = OxmlElement('w:tblStyle')
                tblStyle.set(qn('w:val'), 'TableGrid')
                tblPr.append(tblStyle)
                tbl.append(tblPr)
                
                app_table = Table(tbl, doc)
                hdr_row = app_table.add_row()
                hdr_row.cells[0].text = "S.No"
                hdr_row.cells[1].text = "Component / Apparatus Name"
                hdr_row.cells[2].text = "Specification"
                hdr_row.cells[3].text = "Quantity"
                
                for cell in hdr_row.cells:
                    set_cell_background(cell, "F1F5F9")
                    for p in cell.paragraphs:
                        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                        for run in p.runs:
                            set_run_font(run, font_name='Times New Roman', size_pt=10, bold=True)
                            
                for a_idx, app_item in enumerate(apps):
                    r_row = app_table.add_row()
                    r_row.cells[0].text = str(a_idx + 1)
                    r_row.cells[1].text = app_item.get("name", "")
                    r_row.cells[2].text = app_item.get("specification", "N/A")
                    r_row.cells[3].text = str(app_item.get("quantity", "1"))
                    
                    for cell in r_row.cells:
                        for p in cell.paragraphs:
                            for run in p.runs:
                                set_run_font(run, font_name='Times New Roman', size_pt=10)
                                
                p_app._element.addnext(tbl)
                last_el = tbl
            else:
                add_paragraph_after(text="None", bold_lbl="APPARATUS REQUIRED:\n")
        else:
            sw_req = exp.get("softwareRequired", "None")
            hw_req = exp.get("hardwareRequired", "None")
            add_paragraph_after(text=f"Hardware: {hw_req}  |  Software: {sw_req}", bold_lbl="REQUIREMENTS:\n")
            
        # 5. ALGORITHM
        alg_text = exp.get("algorithm", "")
        if alg_text:
            add_paragraph_after(text=alg_text, bold_lbl="ALGORITHM:\n")
            
        # 6. PROCEDURE
        proc = exp.get("procedure", [])
        if proc:
            proc_text = ""
            for p_idx, step in enumerate(proc):
                proc_text += f"{p_idx + 1}. {step}\n"
            add_paragraph_after(text=proc_text.strip(), bold_lbl="PROCEDURE:\n")
            
        # 7. PROGRAM 1 & PROGRAM 2
        prog1 = exp.get("program1")
        prog2 = exp.get("program2")
        prog_old = exp.get("program")
        
        if prog1 or prog_old:
            lbl = "PROGRAM 1:\n" if prog1 else "PROGRAM / CONFIGURATION:\n"
            code = prog1 if prog1 else prog_old
            add_paragraph_after(text=code, bold_lbl=lbl, is_code=True)
            
        if prog2:
            add_paragraph_after(text=prog2, bold_lbl="PROGRAM 2:\n", is_code=True)
            
        # 8. SAMPLE INPUT & SAMPLE OUTPUT
        s_in = exp.get("sampleInput", "")
        s_out = exp.get("sampleOutput", "")
        if s_in or s_out:
            add_paragraph_after(text=f"Sample Input:\n{s_in}\n\nSample Output:\n{s_out}", bold_lbl="OBSERVATIONS & OUTPUT:\n")
            
        # 9. RESULT
        res_text = exp.get("result", "")
        add_paragraph_after(text=res_text, bold_lbl="RESULT:\n", color=green_color)
        
        # 10. BLOOM'S TAXONOMY LEVEL & CO MAPPING
        co_map = exp.get("coMapping", "")
        bl_level = exp.get("bloomsTaxonomy") or exp.get("bloomsLevel") or ""
        add_paragraph_after(text=f"Mapped Course Outcome: {co_map}  |  Bloom's Level: {bl_level}", bold_lbl="MAPPING:\n")
        
        # 11. VIVA QUESTIONS
        viva = exp.get("vivaQuestions", [])
        if viva:
            viva_text = ""
            for v_idx, vq in enumerate(viva[:10]):
                q = vq.get("question", "")
                a = vq.get("answer", "")
                viva_text += f"Q{v_idx + 1}: {q}\nA{v_idx + 1}: {a}\n\n"
            add_paragraph_after(text=viva_text.strip(), bold_lbl="VIVA VOCE QUESTIONS & ANSWERS:\n")
            
        # 12. APPLICATIONS
        apps_real = exp.get("applications", "")
        if apps_real:
            add_paragraph_after(text=apps_real, bold_lbl="APPLICATIONS:\n")
            
        # 13. REFERENCES
        refs = exp.get("references", "")
        if refs:
            add_paragraph_after(text=refs, bold_lbl="REFERENCES:\n")
            
        if i < 9:
            new_p_el = OxmlElement('w:p')
            last_el.addnext(new_p_el)
            last_el = new_p_el
            p_br = docx.text.paragraph.Paragraph(new_p_el, doc.part)
            p_br.add_run().add_break(docx.enum.text.WD_BREAK.PAGE)
            
    # Save output docx
    doc.save(output_path)
    
    # Clean up temporary input file
    try:
        os.remove(input_path)
    except:
        pass
        
    print("SUCCESS")

if __name__ == '__main__':
    main()
