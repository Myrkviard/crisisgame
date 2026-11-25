# -*- coding: utf-8 -*-
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.oxml.ns import qn
from PIL import Image
import os

W, H = 13.333, 7.5
FOREST = RGBColor(0x1E, 0x3B, 0x2C)
FOREST_D = RGBColor(0x14, 0x2A, 0x1F)
SAGE   = RGBColor(0x9C, 0xB4, 0x9C)
SAGE_L = RGBColor(0xDB, 0xE4, 0xD6)
CREAM  = RGBColor(0xFA, 0xF7, 0xF0)
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
ORANGE = RGBColor(0xD9, 0x7C, 0x2B)
ORANGE_L = RGBColor(0xF0, 0xB6, 0x6A)
INK    = RGBColor(0x25, 0x30, 0x28)
GREY   = RGBColor(0x6D, 0x7B, 0x71)
BEIGE_D = RGBColor(0xC2, 0xB2, 0x92)
SAND   = RGBColor(0xE9, 0xE1, 0xCF)
RED_S  = RGBColor(0xB2, 0x5B, 0x3A)

FONT = "Calibri"

prs = Presentation()
prs.slide_width = Inches(W)
prs.slide_height = Inches(H)
BLANK = prs.slide_layouts[6]

IMG = "/workspace/deck/img"

def crop_to(src, dst, ratio, maxw, q=80):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio); x = (w - nw) // 2; im = im.crop((x, 0, x + nw, h))
    else:
        nh = int(w / ratio); y = (h - nh) // 2; im = im.crop((0, y, 0 + w, y + nh))
    if im.size[0] > maxw:
        im = im.resize((maxw, int(maxw / ratio)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=q, optimize=True, progressive=True)
    return dst

IM = {}
def prep(name, ratio, maxw, q=80):
    d = f"{IMG}/{name}_p.jpg"
    crop_to(f"{IMG}/{name}.jpg", d, ratio, maxw, q)
    IM[name] = d
    return d

prep("cover", 16/9, 1800, 82)
prep("conclusion", 16/9, 1800, 82)
prep("aventure", 3/2, 1000)
prep("cabane", 3/2, 1000)
prep("camping", 3/2, 1000)
prep("huttopia", 3/2, 1000)
prep("adv", 3/4, 950)
prep("refuges", 3/4, 950)

def slide(bg=CREAM):
    s = prs.slides.add_slide(BLANK)
    r = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(W), Inches(H))
    solid(r, bg)
    return s

def solid(shp, rgb, alpha=None, line_rgb=None, line_w=None):
    shp.fill.solid()
    shp.fill.fore_color.rgb = rgb
    if alpha is not None:
        sf = shp._element.spPr.find(qn('a:solidFill'))
        srgb = sf.find(qn('a:srgbClr'))
        el = srgb.makeelement(qn('a:alpha'), {'val': str(int(alpha * 100000))})
        srgb.append(el)
    if line_rgb is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line_rgb
        shp.line.width = Pt(line_w if line_w else 0.75)
    shp.shadow.inherit = False
    return shp

def rect(s, x, y, w, h, rgb, alpha=None, line_rgb=None, line_w=None, round_=None):
    st = MSO_SHAPE.ROUNDED_RECTANGLE if round_ is not None else MSO_SHAPE.RECTANGLE
    shp = s.shapes.add_shape(st, Inches(x), Inches(y), Inches(w), Inches(h))
    if round_ is not None:
        try: shp.adjustments[0] = round_
        except Exception: pass
    return solid(shp, rgb, alpha, line_rgb, line_w)

def tb(s, x, y, w, h, text, size=11, color=INK, bold=False, italic=False,
       align=PP_ALIGN.LEFT, font=None, line=1.04, space=0, anchor=MSO_ANCHOR.TOP, wrap=True):
    box = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = wrap
    tf.vertical_anchor = anchor
    tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
    first = True
    for ln in text.split("\n"):
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = align
        p.line_spacing = line
        p.space_after = Pt(space)
        r = p.add_run(); r.text = ln
        f = r.font
        f.size = Pt(size); f.bold = bold; f.italic = italic
        f.color.rgb = color; f.name = font or FONT
    return box

def kicker(s, x, y, text, color=ORANGE):
    tb(s, x, y, 9, 0.3, text.upper(), size=10.5, color=color, bold=True)

def title(s, x, y, w, text, size=24, color=FOREST, h=1.0):
    tb(s, x, y, w, h, text, size=size, color=color, bold=True, line=1.03)

def footer(s, n, tag=""):
    rect(s, 0.55, 7.06, 12.23, 0.012, SAGE)
    tb(s, 0.55, 7.12, 8.5, 0.3, "Étude concurrentielle — Hébergement de pleine nature au Québec · Huttopia",
       size=8, color=GREY)
    if tag:
        tb(s, 8.9, 7.12, 3.5, 0.3, tag, size=8, color=GREY, align=PP_ALIGN.RIGHT)
    tb(s, 12.35, 7.12, 0.45, 0.3, f"{n} / 20", size=8, color=GREY, align=PP_ALIGN.RIGHT)

def note(s, x, y, w, text, h=0.45):
    rect(s, x, y, w, h, SAND, round_=0.12)
    tb(s, x + 0.15, y + 0.07, w - 0.3, h - 0.14, text, size=8.5, color=INK, italic=True, line=1.0)

def dots(n, tot=3):
    return "●" * n + "○" * (tot - n)

def line_seg(s, x1, y1, x2, y2, color=FOREST, w=1.2, dash=None):
    c = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    c.line.color.rgb = color
    c.line.width = Pt(w)
    c.shadow.inherit = False
    if dash:
        ln = c.line._get_or_add_ln()
        ln.append(ln.makeelement(qn('a:prstDash'), {'val': dash}))
    return c

def num_badge(s, x, y, d, txt, bg=FOREST, fg=WHITE, size=12):
    e = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(d), Inches(d))
    solid(e, bg)
    tf = e.text_frame
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = txt
    r.font.color.rgb = fg; r.font.size = Pt(size); r.font.bold = True; r.font.name = FONT

def set_cell(cell, text, size=9.5, color=INK, bold=False, bg=None, align=PP_ALIGN.LEFT, italic=False):
    cell.margin_left = Inches(0.08); cell.margin_right = Inches(0.08)
    cell.margin_top = Inches(0.03); cell.margin_bottom = Inches(0.03)
    cell.vertical_anchor = MSO_ANCHOR.MIDDLE
    if bg is not None:
        cell.fill.solid(); cell.fill.fore_color.rgb = bg
    tf = cell.text_frame
    tf.word_wrap = True
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = 0.98
    r = p.add_run(); r.text = text
    f = r.font
    f.size = Pt(size); f.bold = bold; f.italic = italic; f.color.rgb = color; f.name = FONT

# ============================================================ S1 - COVER
s = slide(FOREST)
s.shapes.add_picture(IM["cover"], 0, 0, Inches(W), Inches(H))
rect(s, 0, 0, W, H, FOREST_D, alpha=0.62)
rect(s, 0, 0, 0.18, H, ORANGE)
tb(s, 0.75, 0.85, 6, 0.35, "ÉTUDE CONCURRENTIELLE · QUÉBEC", size=12, color=ORANGE_L, bold=True)
tb(s, 0.75, 1.35, 11.6, 1.9,
   "L'hébergement de pleine nature au Québec :\nun marché en pleine diversification",
   size=34, color=WHITE, bold=True, line=1.05)
rect(s, 0.75, 3.85, 11.6, 1.75, WHITE, alpha=0.92, round_=0.06)
rect(s, 0.95, 4.03, 0.045, 1.4, ORANGE)
tb(s, 1.15, 4.02, 11.0, 0.35, "PROBLÉMATIQUE", size=10, color=ORANGE, bold=True)
tb(s, 1.15, 4.38, 10.9, 1.15,
   "Face à la diversification de l'hébergement de pleine nature au Québec, quels éléments de "
   "l'expérience Huttopia constituent de véritables avantages concurrentiels et quels éléments "
   "pourraient renforcer sa différenciation ?",
   size=13.5, color=INK, line=1.15)
tb(s, 0.75, 6.15, 11.9, 0.85,
   "Étude concurrentielle  ·  Marchés étudiés : Sutton et les Laurentides\n"
   "Analyse des offres, des expériences clients et du positionnement d'Huttopia",
   size=11, color=CREAM, line=1.3)
tb(s, 12.35, 7.05, 0.45, 0.3, "1 / 20", size=8, color=CREAM, align=PP_ALIGN.RIGHT)

# ============================================================ S2 - CARTOGRAPHIE
s = slide()
kicker(s, 0.55, 0.4, "Partie 1 · Qui sont les concurrents ?")
title(s, 0.55, 0.68, 12.2, "Huttopia évolue dans un environnement concurrentiel composé d'acteurs aux positionnements variés.", size=21, h=0.85)
rect(s, 0.55, 1.65, 8.0, 5.2, SAGE_L, round_=0.045)
tb(s, 0.85, 1.8, 5, 0.3, "CARTOGRAPHIE SCHEMATIQUE — SUD DU QUÉBEC", size=9.5, color=FOREST, bold=True)

def pin(s, x, y, label, cat, main=False):
    C = {"huttopia": ORANGE, "direct": FOREST, "insolite": RGBColor(0x4F, 0x7F, 0x6B), "camping": BEIGE_D}
    d = 0.16 if main else 0.12
    e = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(d), Inches(d))
    solid(e, C[cat], line_rgb=WHITE if main else None, line_w=1.2)
    tb(s, x + d + 0.08, y - 0.05, 5.6, 0.5, label, size=10 if main else 9,
       color=FOREST if main else INK, bold=main, line=0.95)

rect(s, 1.0, 2.35, 7.1, 1.6, WHITE, alpha=0.75, round_=0.05, line_rgb=SAGE, line_w=1)
tb(s, 1.2, 2.43, 4, 0.3, "LES LAURENTIDES", size=10.5, color=FOREST, bold=True)
pin(s, 1.35, 2.78, "Huttopia Les Deux Lacs", "huttopia", main=True)
pin(s, 1.35, 3.1, "Les Refuges Perchés Mont-Tremblant", "insolite")
pin(s, 1.35, 3.44, "Camping Lac Chat  *   ·   Camping Grand Pin  *", "camping")

e = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(7.62), Inches(4.95), Inches(0.13), Inches(0.13)); solid(e, INK)
tb(s, 6.75, 4.87, 0.82, 0.3, "Montréal", size=9, color=INK, bold=True, align=PP_ALIGN.RIGHT)

rect(s, 1.0, 4.72, 7.1, 1.98, WHITE, alpha=0.75, round_=0.05, line_rgb=SAGE, line_w=1)
tb(s, 1.2, 4.8, 4.5, 0.3, "SUTTON — CANTONS-DE-L'EST", size=10.5, color=FOREST, bold=True)
pin(s, 1.35, 5.16, "Huttopia Sutton", "huttopia", main=True)
pin(s, 1.35, 5.48, "Au Diable Vert  (concurrence directe)", "direct")
pin(s, 1.35, 5.8, "Cabin Sutton (7 chalets haut de gamme)", "insolite")
pin(s, 1.35, 6.12, "Camping écologique de Frelighsburg  ·  Vallée Bleue *  ·  des Sommets *", "camping")

rect(s, 8.85, 1.65, 3.93, 4.45, WHITE, round_=0.05, line_rgb=SAGE, line_w=1)
tb(s, 9.05, 1.8, 3.5, 0.3, "LECTURE DU TERRAIN", size=10, color=FOREST, bold=True)
LEG = [
    (ORANGE, "Huttopia — acteur central du benchmark"),
    (FOREST, "Concurrence directe (Au Diable Vert)"),
    (RGBColor(0x4F, 0x7F, 0x6B), "Hébergements insolites (Refuges Perchés, Cabin Sutton)"),
    (BEIGE_D, "Campings traditionnels (emplacements)"),
]
yy = 2.2
for c, t in LEG:
    e = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9.05), Inches(yy), Inches(0.12), Inches(0.12)); solid(e, c)
    tb(s, 9.28, yy - 0.06, 3.35, 0.7, t, size=9, color=INK, line=0.95)
    yy += 0.6
rect(s, 9.05, 4.75, 3.5, 1.1, SAND, round_=0.1)
tb(s, 9.2, 4.85, 3.2, 0.95,
   "Le dossier documente aussi : Hôtel Le Montagnard, Les Côteaux Missisquoi, Camping Havre des Îles (concurrence indirecte / demi-directe).",
   size=8, color=INK, line=1.05)
note(s, 0.55, 6.6, 12.23,
     "* Aucune donnée détaillée dans le dossier pour Vallée Bleue, des Sommets, Lac Chat et Grand Pin — à documenter. Distances et parts de marché non indiquées dans le dossier.", h=0.36)
footer(s, 2, "Partie 1 · Concurrents")

# ============================================================ S3 - MATRICE
s = slide()
kicker(s, 0.55, 0.4, "Partie 1 · Qui sont les concurrents ?")
title(s, 0.55, 0.68, 12.2, "Les concurrents ne vendent pas tous la même expérience de nature.", size=24, h=0.6)

x0, y0, pw, ph = 1.15, 1.7, 8.3, 4.7
rect(s, x0, y0, pw, ph, WHITE, round_=0.02)
zone = rect(s, x0 + pw * 0.60, y0 + 0.12, pw * 0.36, ph * 0.44, SAGE_L, alpha=0.5)
solid(zone, SAGE_L, alpha=0.5)
zone.line.color.rgb = ORANGE; zone.line.width = Pt(1.4)
lnel = zone.line._get_or_add_ln()
lnel.append(lnel.makeelement(qn('a:prstDash'), {'val': 'dash'}))
tb(s, x0 + pw * 0.64, y0 + 0.2, pw * 0.3, 0.5, "Espaces de\ndifférenciation", size=9.5, color=ORANGE, bold=True, line=0.95)

line_seg(s, x0, y0 + ph, x0 + pw, y0 + ph, color=GREY, w=1.5)
line_seg(s, x0, y0, x0, y0 + ph, color=GREY, w=1.5)
tb(s, x0, y0 + ph + 0.1, pw, 0.3, "Niveau de confort et de services  →  du rustique au haut confort",
   size=9.5, color=GREY, align=PP_ALIGN.CENTER)
tb(s, x0 - 0.3, y0 - 0.34, pw + 0.6, 0.3, "Niveau d'immersion  ↑  du camping classique à l'expérience nature immersive",
   size=9.5, color=GREY, align=PP_ALIGN.CENTER)

def pt(s, fx, fy, label, cat, big=False, note_t=None, above=False, lab_w=2.9):
    C = {"huttopia": ORANGE, "direct": FOREST, "insolite": RGBColor(0x4F, 0x7F, 0x6B), "camping": BEIGE_D, "grey": GREY}
    d = 0.3 if big else 0.17
    px = x0 + fx * pw - d / 2
    py = y0 + (1 - fy) * ph - d / 2
    e = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(px), Inches(py), Inches(d), Inches(d))
    solid(e, C[cat], line_rgb=WHITE, line_w=1.5 if big else 1)
    ly = py - 0.52 if above else py + d + 0.04
    tb(s, px + d / 2 - lab_w / 2, ly, lab_w, 0.4, label, size=10.5 if big else 8.5,
       color=FOREST if big else INK, bold=big, align=PP_ALIGN.CENTER, line=0.9)
    if note_t:
        tb(s, px + d / 2 - lab_w / 2, ly + (0.42 if big and not above else 0.28), lab_w, 0.6, note_t,
           size=7.5, color=GREY, align=PP_ALIGN.CENTER, italic=True, line=0.92)

pt(s, 0.66, 0.74, "HUTTOPIA", "huttopia", big=True, note_t="nature + confort, offre complète")
pt(s, 0.84, 0.52, "Au Diable Vert", "direct", above=True, note_t="aventure & immersion — confort variable selon l'hébergement", lab_w=3.4)
pt(s, 0.88, 0.26, "Les Refuges Perchés", "insolite", above=True, note_t="cabanes, intimité, déconnexion")
pt(s, 0.90, 0.70, "Cabin Sutton", "insolite", above=True,
   note_t="7 chalets sur pilotis, design scandinave, spa — d'après dossier")
pt(s, 0.17, 0.72, "Hôtel Le Montagnard", "grey", above=True, note_t="hôtellerie classique")
pt(s, 0.80, 0.16, "Les Côteaux Missisquoi", "grey", note_t="écogîtes, autonomie", above=True)
pt(s, 0.14, 0.15, "Campings traditionnels", "camping", above=True,
   note_t="Frelighsburg · Havre des Îles · Vallée Bleue* · des Sommets* · Lac Chat* · Grand Pin*", lab_w=3.3)

tb(s, 9.85, 1.75, 2.95, 3.4,
   "LECTURE\n\nAucun acteur ne combine à ce jour immersion forte et haut confort : c'est l'espace où Huttopia joue.\n\n"
   "Territoires : aventure · immersion rustique · camping traditionnel · nature + confort.",
   size=9.5, color=INK, line=1.12)
tb(s, 9.85, 5.35, 2.95, 1.2, "Positionnements établis à partir des informations du dossier.\n* Données non disponibles.",
   size=8, color=GREY, italic=True, line=1.1)
footer(s, 3, "Partie 1 · Concurrents")

# ============================================================ S4 - FAMILLES
s = slide()
kicker(s, 0.55, 0.4, "Partie 1 · Qui sont les concurrents ?")
title(s, 0.55, 0.68, 12.2, "Trois grandes propositions de valeur structurent le marché.", size=24, h=0.6)
colw = 3.9; gap = 0.215
cols = [
    ("aventure", "Destinations d'aventure", "Au Diable Vert",
     "Activités originales · randonnée · observation des étoiles · VéloVolant · hébergements insolites"),
    ("cabane", "Hébergements immersifs", "Les Refuges Perchés",
     "Cabanes · intimité · autonomie · déconnexion en forêt, au bord du lac Cordon"),
    ("camping", "Campings nature", "Frelighsburg · Havre des Îles",
     "Emplacements au bord de la rivière · calme réglementé · mini-ferme · prix accessibles"),
]
x = 0.55
for img, fam, who, desc in cols:
    rect(s, x, 1.5, colw, 4.0, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
    s.shapes.add_picture(IM[img], Inches(x), Inches(1.5), Inches(colw), Inches(colw * 2 / 3))
    rect(s, x, 1.5 + colw * 2 / 3 - 0.05, colw, 0.05, ORANGE)
    tb(s, x + 0.22, 4.3, colw - 0.44, 0.3, fam.upper(), size=10, color=ORANGE, bold=True)
    tb(s, x + 0.22, 4.62, colw - 0.44, 0.35, who, size=12, color=FOREST, bold=True)
    tb(s, x + 0.22, 5.02, colw - 0.44, 0.85, desc, size=9.5, color=INK, line=1.05)
    x += colw + gap
rect(s, 0.55, 5.75, 12.23, 0.8, FOREST, round_=0.05)
tb(s, 0.85, 5.86, 2.0, 0.4, "HUTTOPIA", size=13, color=ORANGE_L, bold=True)
tb(s, 2.5, 5.9, 10.1, 0.6,
   "Une proposition au carrefour des trois familles : nature, confort, hébergement et services.",
   size=12.5, color=WHITE, line=1.02)
note(s, 0.55, 6.68, 12.23,
     "Frelighsburg et Havre des Îles : visités. Vallée Bleue, des Sommets, Lac Chat, Grand Pin : listés dans le dossier, sans informations détaillées.", h=0.34)
footer(s, 4, "Partie 1 · Concurrents")

# ============================================================ S5 - PRODUIT
s = slide()
kicker(s, 0.55, 0.4, "Partie 2 · Que proposent-ils ? — 4P : Produit")
title(s, 0.55, 0.68, 12.2, "La différenciation repose autant sur les expériences que sur les hébergements.", size=23, h=0.6)
tbl = s.shapes.add_table(7, 4, Inches(0.55), Inches(1.5), Inches(12.23), Inches(4.45)).table
tbl.columns[0].width = Inches(2.15)
for i in range(1, 4): tbl.columns[i].width = Inches(3.36)
for j, hd in enumerate(["Critère", "Au Diable Vert", "Les Refuges Perchés", "Huttopia (Sutton)"]):
    set_cell(tbl.cell(0, j), hd, size=10.5, color=WHITE, bold=True, bg=FOREST)
rows = [
    ("Hébergements", "Refuges perchés, arbres, Treegloo, prospector, chalets — 7 types",
     "20 cabanes en bois accessibles à pied, au bord du lac",
     "130+ unités prêt-à-camper (Trappeur, Canadienne, Bonaventure) + 20 emplacements"),
    ("Confort & équipement", "Très variable : du rustique à l'équipé (sanitaires, sauna, Wi-Fi)",
     "Rustique : poêle à bois, coin cuisine — autonomie requise",
     "Glamping : vrais lits, cuisine équipée, piscine chauffée, centre de vie"),
    ("Immersion", "147 ha, aucun véhicule, hébergements très espacés",
     "Accès à pied (15 min et +), isolement en forêt",
     "65 ha de forêt, au pied du Mont Sutton"),
    ("Activités", "VéloVolant, ObservÉtoiles, kayak, 14 km de sentiers, 4 saisons",
     "Randonnée, canot, baignade (selon saison)",
     "Animations, ateliers enfants, cinéma extérieur, piscine"),
    ("Services & restauration", "Terrasse avec permis d'alcool ; pizzas réchauffées",
     "Aucun service — autonomie totale",
     "Café-bistro, petit-déjeuner, pizzas, bar ; hôtel relié"),
    ("Expériences originales", "VéloVolant & ObservÉtoiles = signature",
     "La cabane elle-même (singularité)",
     "Activités incluses + univers de marque"),
]
for i, r in enumerate(rows, start=1):
    bg_i = CREAM if i % 2 else WHITE
    set_cell(tbl.cell(i, 0), r[0], size=9.5, bold=True, color=FOREST, bg=SAGE_L)
    for j in range(1, 4):
        set_cell(tbl.cell(i, j), r[j], size=9, bg=bg_i)
note(s, 0.55, 6.2, 12.23,
     "Inclus vs payant : à Sutton les activités sont incluses (grande différence avec les concurrents) ; chez ADV, VéloVolant/ObservÉtoiles sont facturés en supplément.", h=0.4)
footer(s, 5, "Partie 2 · Analyse des 4P")

# ============================================================ S6 - PRIX
s = slide()
kicker(s, 0.55, 0.4, "Partie 2 · Que proposent-ils ? — 4P : Prix")
title(s, 0.55, 0.68, 12.2, "Le prix est directement lié au niveau d'immersion, au confort et à l'expérience proposée.", size=22, h=0.6)
px0, px1 = 4.1, 12.3
vmax = 300
def dx(v): return px0 + (px1 - px0) * v / vmax
ry = 1.8
for g in range(0, 301, 50):
    line_seg(s, dx(g), ry, dx(g), ry + 4.0, color=SAGE, w=0.75)
    tb(s, dx(g) - 0.4, ry - 0.28, 0.8, 0.25, f"{g} $", size=8.5, color=GREY, align=PP_ALIGN.CENTER)
bars = [
    ("Au Diable Vert — moyenne constatée", 140, 160, FOREST, "≈ 150 $ / nuit / 2 pers. (visite)"),
    ("Les Refuges Perchés — cabane", 120, 215, RGBColor(0x4F, 0x7F, 0x6B), "120 – 215 $ / nuit / cabane"),
    ("Huttopia Sutton — prêt-à-camper", 0, 293, ORANGE, "jusqu'à ≈ 293 $ (repères 2026)"),
    ("Au Diable Vert — emplacement", 0, 65, SAGE, "max ≈ 65 $/nuit"),
    ("Huttopia Sutton — emplacement", 0, 62, ORANGE_L, "jusqu'à ≈ 62 $ (repères 2026)"),
    ("Frelighsburg — emplacement", 43, 63, BEIGE_D, "43 – 63 $ (2026, avant taxes)"),
]
y = ry + 0.14; bh = 0.42; gapb = 0.26
for name, b1, b2, c, lab in bars:
    tb(s, 0.55, y + 0.05, 3.42, 0.4, name, size=9, color=INK, bold=True, line=0.9)
    lo, hi = min(b1, b2), max(b1, b2)
    rect(s, dx(lo), y, max(dx(hi) - dx(lo), 0.12), bh, c, round_=0.5)
    if dx(hi) + 0.12 + 2.9 > 12.78:
        tb(s, dx(hi) - 3.0, y + 0.05, 2.86, 0.4, lab, size=8.5, color=WHITE,
           bold=True, align=PP_ALIGN.RIGHT, line=0.9)
    else:
        tb(s, dx(hi) + 0.12, y + 0.05, 2.9, 0.4, lab, size=8.5, color=GREY, line=0.9)
    y += bh + gapb
rect(s, 0.55, 6.32, 12.23, 0.78, SAND, round_=0.1)
tb(s, 0.75, 6.4, 11.85, 0.62,
   "Prudence de lecture : capacités, dates et prestations diffèrent — un emplacement (2 pers.) et une cabane (2–8 pers.) ne sont pas équivalents ; "
   "services inclus (activités chez Huttopia) et suppléments (VéloVolant, transport des bagages, bois) doivent être intégrés. "
   "Tarifs Huttopia Les Deux Lacs : non relevés dans le dossier.", size=8.5, color=INK, line=1.05)
footer(s, 6, "Partie 2 · Analyse des 4P")

# ============================================================ S7 - DISTRIBUTION
s = slide()
kicker(s, 0.55, 0.4, "Partie 2 · Que proposent-ils ? — 4P : Distribution")
title(s, 0.55, 0.68, 12.2, "La réservation et la commercialisation des expériences participent à la différenciation.", size=22, h=0.6)
rect(s, 0.55, 1.5, 6.9, 4.25, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
tb(s, 0.8, 1.65, 6, 0.3, "MODÈLE AU DIABLE VERT — PARCOURS DE RÉSERVATION", size=10, color=FOREST, bold=True)
steps = ["Découverte du site", "Choix de l'hébergement", "Sélection des dates", "Réservation en ligne", "Activités complémentaires"]
cx = 0.82; cw = 1.22
for i, st in enumerate(steps):
    ch = s.shapes.add_shape(MSO_SHAPE.CHEVRON, Inches(cx), Inches(2.2), Inches(cw + 0.1), Inches(1.05))
    solid(ch, FOREST if i < 4 else ORANGE)
    tf = ch.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = st
    r.font.size = Pt(8); r.font.color.rgb = WHITE; r.font.name = FONT; r.font.bold = True
    cx += cw + 0.05
tb(s, 0.8, 3.55, 6.35, 2.1,
   "• Hébergements et certaines activités réservables directement en ligne\n"
   "• Complémentarité entre hébergement et vente d'expériences sur place\n"
   "• Visibilité : Bonjour Québec, Tourisme Sutton, Cantons-de-l'Est, Google\n"
   "• Présence dans les réseaux touristiques de Sutton et de la région",
   size=9.5, color=INK, line=1.2, space=2)
rect(s, 7.7, 1.5, 5.08, 4.25, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
tb(s, 7.95, 1.65, 4.6, 0.3, "AUTRES CONCURRENTS", size=10, color=FOREST, bold=True)
tb(s, 7.95, 2.05, 4.62, 3.6,
   "Huttopia Sutton\nSite officiel + moteur ; présent sur Booking, Vrbo, Tripadvisor, Google Hotels.\n\n"
   "Les Refuges Perchés\nSite officiel ; relais via le Parc Éco-Laurentides et les organismes régionaux.\n\n"
   "Camping écologique de Frelighsburg\nSite simple et informatif ; annuaires touristiques (Bonjour Québec).\n\n"
   "Camping Havre des Îles\nBouche-à-oreille ; quitté les plateformes (OTA).",
   size=9.5, color=INK, line=1.12)
rect(s, 0.55, 6.0, 12.23, 0.8, FOREST, round_=0.05)
tb(s, 0.85, 6.1, 1.3, 0.5, "→ LEVIER", size=11, color=ORANGE_L, bold=True)
tb(s, 2.05, 6.08, 10.5, 0.68,
   "Opportunité de commercialisation croisée : hébergement, activités et services vendus comme un parcours unique.",
   size=11.5, color=WHITE, line=1.05)
footer(s, 7, "Partie 2 · Analyse des 4P")

# ============================================================ S8 - COMMUNICATION
s = slide()
kicker(s, 0.55, 0.4, "Partie 2 · Que proposent-ils ? — 4P : Communication")
title(s, 0.55, 0.68, 12.2, "Les concurrents cherchent à vendre une expérience émotionnelle avant même de vendre un hébergement.", size=21, h=0.6)
mo = [("aventure", "Au Diable Vert", "Aventure · montagne · activités 4 saisons · déconnexion\nPanoramas, familles et sportifs, couleurs engagées"),
      ("refuges", "Les Refuges Perchés", "Intimité · cabanes · lac · forêt · tranquillité\nL'architecture des cabanes au cœur du discours"),
      ("huttopia", "Huttopia", "Nature · confort · authenticité · séjour plein air\nFamille, convivialité, val du Mont Sutton, touche française")]
x = 0.55; colw = 3.9
for img, nm, desc in mo:
    rect(s, x, 1.5, colw, 3.8, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
    s.shapes.add_picture(IM[img], Inches(x), Inches(1.5), Inches(colw), Inches(colw * 2 / 3))
    rect(s, x, 1.5 + colw * 2 / 3 - 0.05, colw, 0.05, ORANGE)
    tb(s, x + 0.22, 4.32, colw - 0.44, 0.32, nm, size=12, color=FOREST, bold=True)
    tb(s, x + 0.22, 4.66, colw - 0.44, 1.0, desc, size=9, color=INK, line=1.12)
    x += colw + 0.215
tb(s, 0.55, 5.52, 12.2, 0.35, "CONSTATS TRANSVERSAUX", size=10, color=ORANGE, bold=True)
pills = ["Photos paysages / nature en premier",
         "Une promesse émotionnelle avant le produit",
         "Le territoire comme argument de vente"]
x = 0.55
for p_txt in pills:
    rect(s, x, 5.92, 3.95, 0.55, SAGE_L, round_=0.5)
    tb(s, x + 0.15, 6.03, 3.65, 0.4, p_txt, size=9.5, color=FOREST, bold=True, align=PP_ALIGN.CENTER)
    x += 4.14
note(s, 0.55, 6.62, 12.23, "Chaque acteur construit sa promesse autour de son actif différenciant : aventure (ADV) · intimité (RP) · confort organisé (Huttopia).", h=0.34)
footer(s, 8, "Partie 2 · Analyse des 4P")

# ============================================================ S9 - JOURNEY
s = slide()
kicker(s, 0.55, 0.4, "Partie 3 · Que vit réellement leur client ?")
title(s, 0.55, 0.68, 12.2, "L'expérience client ne commence pas à l'arrivée sur le site, mais dès la recherche du séjour.", size=21, h=0.6)
steps = [
    ("01", "Avant le séjour", "Infos claires, tarifs lisibles, réservation simple",
     "Sites bien structurés (ADV : parcours fluide ; RP : fiche par refuge)",
     "Signalétique routière insuffisante vers ADV"),
    ("02", "Préparation", "Anticiper équipements et autonomie",
     "Consignes pré-séjour (lampe frontale, poêle à bois, alimentation)",
     "Autonomie à la charge du client (bagages, bois)"),
    ("03", "Arrivée", "Orientation lisible, accueil humain",
     "Accueil chaleureux (ADV, Frelighsburg, Havre des Îles) + tour du site",
     "Réception ADV vieillissante · repérage de la réception à Frelighsburg"),
    ("04", "Pendant le séjour", "Immersion, confort, activités, services",
     "Nature spectaculaire, vaches, VéloVolant testé ; activités incluses à Sutton",
     "Confort variable (ADV) ; tarifs éco sans draps ; vétusté signalée"),
    ("05", "Après le séjour", "Reconnaissance, avis, fidélisation",
     "Avis très positifs sur le cadre (Google ≈ 4,5/5 Sutton et Frelighsburg)",
     "Rapport qualité/prix discuté selon l'hébergement"),
]
colw = 2.33; gap = 0.14
curve_h = [3.35, 3.1, 2.95, 2.55, 2.9]
cx_list = [0.55 + i * (colw + gap) + colw / 2 for i in range(5)]
for i in range(4):
    line_seg(s, cx_list[i], curve_h[i] + 0.35, cx_list[i + 1], curve_h[i + 1] + 0.35, color=ORANGE, w=2.0)
for i in range(5):
    e = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(cx_list[i] - 0.05), Inches(curve_h[i] + 0.30), Inches(0.1), Inches(0.1))
    solid(e, ORANGE)
tb(s, 8.2, 2.0, 4.6, 0.3, "Niveau d'expérience ressenti (illustratif)", size=8, color=ORANGE, italic=True)
x = 0.55
y = 3.4
for i, (num, stt, exp, pos, neg) in enumerate(steps):
    rect(s, x, y, colw, 3.35, WHITE, round_=0.05, line_rgb=SAGE, line_w=1)
    num_badge(s, x + 0.12, y + 0.12, 0.42, num)
    tb(s, x + 0.62, y + 0.2, colw - 0.7, 0.5, stt, size=10, color=FOREST, bold=True, line=0.9)
    tb(s, x + 0.14, y + 0.75, colw - 0.28, 0.85, "Attentes :\n" + exp, size=7.5, color=GREY, italic=True, line=1.0)
    tb(s, x + 0.14, y + 1.62, colw - 0.28, 1.15, "+ " + pos, size=7.5, color=FOREST, line=1.02)
    tb(s, x + 0.14, y + 2.78, colw - 0.28, 0.55, "– " + neg, size=7.5, color=RED_S, line=1.0)
    x += colw + gap
tb(s, 0.55, 6.85, 12.2, 0.3, "Observations issues des visites terrain du dossier — aucun ressenti extrapolé.", size=8.5, color=GREY, italic=True)
footer(s, 9, "Partie 3 · Expérience client")

# ============================================================ S10 - AU DIABLE VERT
s = slide()
kicker(s, 0.55, 0.4, "Partie 3 · Étude de cas")
title(s, 0.55, 0.68, 8.4, "Au Diable Vert transforme son environnement naturel en véritable destination d'activités.", size=21, h=1.0)
s.shapes.add_picture(IM["adv"], Inches(9.33), Inches(1.5), Inches(3.45), Inches(4.6))
rect(s, 0.55, 1.85, 8.55, 2.4, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
rect(s, 0.55, 1.85, 0.09, 2.4, FOREST)
tb(s, 0.85, 1.97, 8, 0.3, "POINTS FORTS OBSERVÉS", size=10, color=FOREST, bold=True)
tb(s, 0.85, 2.32, 8.05, 1.85,
   "• Environ 147 ha — hébergements très espacés, immersion dans les collines\n"
   "• 30 refuges en 7 types (2 à 8 pers.) · ~25 emplacements tente\n"
   "• 14 km de sentiers privés · kayak sur la rivière Missisquoi\n"
   "• VéloVolant et activités originales — aucun véhicule sur le site\n"
   "• Interaction avec les vaches · accueil très chaleureux",
   size=9.5, color=INK, line=1.16, space=1)
rect(s, 0.55, 4.4, 8.55, 2.35, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
rect(s, 0.55, 4.4, 0.09, 2.35, RED_S)
tb(s, 0.85, 4.52, 8, 0.3, "LIMITES OBSERVÉES", size=10, color=RED_S, bold=True)
tb(s, 0.85, 4.87, 8.05, 1.8,
   "• Refuges sans eau courante, douche ni électricité — toilettes sèches à l'esthétique plastique\n"
   "• Déplacements à pied jusqu'à 20 minutes · transport des bagages payant\n"
   "• Pas de véritable restauration (pizzas réchauffées) · produits locaux quasi absents\n"
   "• Prix moyen observé ≈ 150 $ CA / nuit pour deux — jugé élevé pour le type d'hébergement",
   size=9.5, color=INK, line=1.16, space=1)
rect(s, 0.55, 6.9, 12.23, 0.72, FOREST, round_=0.06)
tb(s, 0.85, 6.97, 8.1, 0.6, "Paradoxe : une immersion exceptionnelle, mais une autonomie et un confort qui ne conviennent pas à toutes les clientèles.", size=10.5, color=WHITE, line=1.0)
tb(s, 9.25, 6.97, 3.35, 0.6, "« La nature devient ici le principal produit touristique. »", size=10.5, color=ORANGE_L, italic=True, bold=True, line=1.0)
tb(s, 12.35, 6.42, 0.45, 0.3, "10 / 20", size=8, color=GREY, align=PP_ALIGN.RIGHT)

# ============================================================ S11 - REFUGES PERCHES
s = slide()
kicker(s, 0.55, 0.4, "Partie 3 · Étude de cas")
title(s, 0.55, 0.68, 8.4, "L'expérience repose sur la singularité de la cabane et la sensation d'isolement.", size=21, h=1.0)
s.shapes.add_picture(IM["refuges"], Inches(9.33), Inches(1.5), Inches(3.45), Inches(4.6))
rect(s, 0.55, 1.85, 4.1, 2.4, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
tb(s, 0.8, 1.97, 3.6, 0.3, "L'OFFRE", size=10, color=FOREST, bold=True)
tb(s, 0.8, 2.32, 3.7, 1.5,
   "• 20 refuges variés au bord du lac Cordon (Parc Éco-Laurentides)\n"
   "• Cabanes en bois accessibles à pied, isolées les unes des autres\n"
   "• Équipements rustiques · autonomie et déconnexion\n"
   "• Randonnée, canot, baignade selon la saison",
   size=9, color=INK, line=1.12, space=1)
tb(s, 0.8, 3.85, 3.7, 0.35, "120 – 215 $ CA / nuit / cabane", size=12, color=ORANGE, bold=True)
rect(s, 4.85, 1.85, 4.1, 1.85, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
rect(s, 4.85, 1.85, 0.09, 1.85, FOREST)
tb(s, 5.1, 1.97, 3.6, 0.3, "AVIS CLIENTS — POINTS FORTS", size=10, color=FOREST, bold=True)
tb(s, 5.1, 2.32, 3.7, 1.3, "• Originalité des cabanes\n• Beauté du cadre naturel\n• Calme et proximité du lac\n• Déconnexion et immersion réelles",
   size=9, color=INK, line=1.2, space=2)
rect(s, 4.85, 3.9, 4.1, 1.65, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
rect(s, 4.85, 3.9, 0.09, 1.65, RED_S)
tb(s, 5.1, 4.02, 3.6, 0.3, "POINTS DE VIGILANCE", size=10, color=RED_S, bold=True)
tb(s, 5.1, 4.37, 3.7, 1.1, "• Transport des bagages à pied\n• Confort rustique — autonomie nécessaire\n• Peu adapté aux attentes hôtelières",
   size=9, color=INK, line=1.2, space=2)
rect(s, 0.55, 5.75, 8.4, 1.15, FOREST, round_=0.06)
tb(s, 0.8, 5.85, 8.0, 0.3, "FACE À HUTTOPIA", size=9.5, color=ORANGE_L, bold=True)
tb(s, 0.8, 6.15, 8.0, 0.68,
   "Une expérience intimiste et autonome, contre une offre plus complète, servicielle et diversifiée chez Huttopia. "
   "Leur avantage concurrentiel : l'intimité et l'immersion en forêt.", size=9.5, color=WHITE, line=1.05)
footer(s, 11, "Partie 3 · Étude de cas")
tb(s, 12.35, 6.42, 0.45, 0.3, "", size=8, color=GREY)

# ============================================================ S12 - PROMESSE VS REALITE
s = slide()
kicker(s, 0.55, 0.4, "Partie 3 · Synthèse transversale")
title(s, 0.55, 0.68, 12.2, "Une promesse marketing différenciante n'a de valeur que si elle est réellement vécue par le client.", size=21, h=0.6)
tbl = s.shapes.add_table(6, 3, Inches(0.55), Inches(1.5), Inches(12.23), Inches(4.6)).table
tbl.columns[0].width = Inches(3.5); tbl.columns[1].width = Inches(4.4); tbl.columns[2].width = Inches(4.33)
for j, hd in enumerate(["Ce que l'établissement promet", "Ce que nous avons réellement observé", "Ce que cela nous apprend"]):
    set_cell(tbl.cell(0, j), hd, size=10.5, color=WHITE, bold=True, bg=FOREST)
prom = [
    ("ADV — Immersion totale en nature",
     "Hébergements très espacés sur 147 ha, aucun véhicule, jusqu'à 20 min à pied : l'éloignement fait partie de l'expérience.",
     "La promesse est tenue — la contrainte devient la différence ; à assumer et expliquer au client dès la réservation."),
    ("ADV — Aventure et activités 4 saisons",
     "VéloVolant et ObservÉtoiles réels et marquants ; restauration limitée, très peu de produits locaux.",
     "Les activités différencient plus que les services : un levier à s'approprier chez Huttopia."),
    ("ADV / RP — Niveau de confort annoncé",
     "Refuges sans eau courante ni électricité (ADV) ; sacs et nourriture à prévoir ; ≈ 150 $ / nuit / 2 pers.",
     "La transparence sur le confort réel conditionne le rapport qualité/prix perçu et la satisfaction."),
    ("RP — Déconnexion et intimité",
     "Aucune circulation entre les hébergements, accès à pied, cabanes isolées au bord du lac.",
     "Une promesse cohérente et délivrée crée une satisfaction durable, même avec un confort rustique."),
    ("Éléments différenciants peu valorisés",
     "Ferme intégrée et contact animal (ADV) · accueil et mini-ferme (Frelighsburg) · activités incluses.",
     "Des atouts de terrain existent mais restent sous-communicants — une piste aussi pour Huttopia."),
]
for i, (a, b, c) in enumerate(prom, start=1):
    bg_i = CREAM if i % 2 else WHITE
    set_cell(tbl.cell(i, 0), a, size=9, bold=True, color=FOREST, bg=SAGE_L)
    set_cell(tbl.cell(i, 1), b, size=8.5, bg=bg_i)
    set_cell(tbl.cell(i, 2), c, size=8.5, bg=bg_i, italic=True)
rect(s, 0.55, 6.28, 12.23, 0.72, FOREST, round_=0.05)
tb(s, 0.85, 6.38, 11.7, 0.55,
   "La qualité de l'expérience dépend de la cohérence entre la promesse, le prix et la prestation réellement délivrée.",
   size=11.5, color=WHITE, bold=True, line=1.0)
footer(s, 12, "Partie 3 · Synthèse")
tb(s, 12.35, 6.42, 0.45, 0.3, "", size=8, color=GREY)

# ============================================================ S13 - HUTTOPIA AU QUEBEC
s = slide()
kicker(s, 0.55, 0.4, "Partie 4 · Où se situe Huttopia ?")
title(s, 0.55, 0.68, 12.2, "Huttopia s'appuie sur une marque forte et un modèle nature + confort.", size=24, h=0.6)
line_seg(s, 1.0, 2.3, 12.3, 2.3, color=SAGE, w=2)
tl = [("2008", "Entrée au Québec — partenariat avec la Sépaq :\nenviron 500 tentes dans une vingtaine de parcs"),
      ("2015", "Premier site permanent :\nouverture de Huttopia Sutton"),
      ("2025", "Nouvelle implantation :\nouverture de Huttopia Les Deux Lacs"),
      ("2026", "Développement nord-américain :\n2 sites au Québec · 9 destinations en Amérique du Nord")]
for i, (yr, txt) in enumerate(tl):
    cx = 1.0 + i * (11.3 / 3)
    e = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(cx - 0.09), Inches(2.21), Inches(0.18), Inches(0.18))
    solid(e, ORANGE, line_rgb=WHITE, line_w=1.5)
    if cx <= 11.5:
        tb(s, cx - 0.08, 1.76, 1.6, 0.4, yr, size=15, color=FOREST, bold=True)
        tb(s, cx - 0.05, 2.55, 3.15, 0.75, txt, size=8.5, color=INK, line=1.05)
    else:
        tb(s, cx - 2.42, 1.76, 2.3, 0.4, yr, size=15, color=FOREST, bold=True, align=PP_ALIGN.RIGHT)
        tb(s, cx - 3.25, 2.55, 3.1, 0.75, txt, size=8.5, color=INK, line=1.05, align=PP_ALIGN.RIGHT)
tb(s, 1.0, 3.28, 11.5, 0.3, "Évolution du modèle :   Partenariat  →  Implantation  →  Développement de destinations nature",
   size=10, color=ORANGE, bold=True)
rect(s, 0.55, 3.7, 5.0, 2.15, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
s.shapes.add_picture(IM["huttopia"], Inches(0.55), Inches(3.7), Inches(5.0), Inches(1.45))
tb(s, 0.75, 5.22, 4.6, 0.3, "HUTTOPIA SUTTON  ·  65 ha de forêt", size=10.5, color=FOREST, bold=True)
tb(s, 0.75, 5.5, 4.7, 0.85,
   "Au pied du Mont Sutton · ≈ 1 h 30 de Montréal · montagne, sentiers, plein air · nature + confort + activités",
   size=8.5, color=INK, line=1.08)
rect(s, 5.75, 3.7, 7.03, 1.05, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
tb(s, 5.98, 3.82, 6.6, 0.3, "HUTTOPIA LES DEUX LACS  ·  50 acres · 2 lacs", size=10.5, color=FOREST, bold=True)
tb(s, 5.98, 4.14, 6.65, 0.55,
   "Intégration au Parc Éco-Laurentides · ≈ 1 h 30 de Montréal / 2 h 15 d'Ottawa · 36 km+ de sentiers · nature + immersion + quatre saisons",
   size=8.5, color=INK, line=1.08)
tb(s, 5.98, 4.92, 6.7, 0.9,
   "Partenariats : Sépaq (prêt-à-camper) · acteurs touristiques et activités locales · partenaires commerciaux et agences de voyages · Parc Éco-Laurentides (Les Deux Lacs).",
   size=9, color=INK, line=1.12)
rect(s, 5.75, 5.85, 7.03, 0.95, SAND, round_=0.08)
tb(s, 5.95, 5.97, 6.65, 0.72,
   "Acteur récent, somme toute, mais une implantation qui évolue vite : de la tente Sépaq aux véritables destinations nature — marque et concept en plus.",
   size=9.5, color=INK, italic=True, line=1.08)
footer(s, 13, "Partie 4 · Huttopia")

# ============================================================ S14 - 4P HUTTOPIA
s = slide()
kicker(s, 0.55, 0.4, "Partie 4 · Où se situe Huttopia ?")
title(s, 0.55, 0.68, 12.2, "Huttopia propose une offre complète, mais doit continuer à renforcer sa différenciation territoriale.", size=21, h=0.6)
blocks = [
    ("PRODUIT — Sutton", "130+ hébergements (tentes Trappeur, Canadienne, Bonaventure, chalets) + 20 emplacements · piscine chauffée, centre de vie, jeux · café-bistro, petit-déjeuner, pizzas, bar · hôtel relié."),
    ("PRIX — Sutton (repères 2026)", "Emplacement jusqu'à ≈ 62 $ · prêt-à-camper jusqu'à ≈ 293 $ / nuit · variations saisonnières · suppléments : animaux, bois, locations, certaines activités · tarif Les Deux Lacs : non relevé."),
    ("DISTRIBUTION", "Site officiel + moteur de réservation · Booking, Vrbo, Tripadvisor, Google Hotels · parcours : destination → dates → hébergement → options → réservation · partenaires touristiques et locaux."),
    ("COMMUNICATION", "« Se reconnecter à la nature sans renoncer au confort » · marque internationale, identité française (crêpes, vin) · photos nature/famille · valorisation du Mont Sutton et des Cantons-de-l'Est."),
]
pos = [(0.55, 1.5), (6.65, 1.5), (0.55, 3.32), (6.65, 3.32)]
for (nm, txt), (bx, by) in zip(blocks, pos):
    rect(s, bx, by, 6.13, 1.65, WHITE, round_=0.05, line_rgb=SAGE, line_w=1)
    rect(s, bx, by, 0.09, 1.65, ORANGE)
    tb(s, bx + 0.25, by + 0.11, 5.6, 0.3, nm, size=11, color=FOREST, bold=True)
    tb(s, bx + 0.25, by + 0.45, 5.72, 1.1, txt, size=9, color=INK, line=1.1)
rect(s, 0.55, 5.25, 12.23, 0.78, FOREST, round_=0.05)
tb(s, 0.85, 5.4, 11.6, 0.5,
   "Le modèle Huttopia repose sur l'association de la nature, du confort et d'une offre touristique structurée.",
   size=12.5, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
tb(s, 0.55, 6.22, 12.23, 0.55,
   "Les Deux Lacs — données du dossier : 50 acres, 2 lacs, 36 km+ de sentiers, positionnement quatre saisons, clientèle privilégiant les courts séjours. Aucun tarif non documenté n'est présenté.",
   size=8.5, color=GREY, italic=True, line=1.1)
footer(s, 14, "Partie 4 · Huttopia")

# ============================================================ S15 - MATRICE COMPARATIVE
s = slide()
kicker(s, 0.55, 0.4, "Partie 4 · Où se situe Huttopia ?")
title(s, 0.55, 0.68, 12.2, "L'avantage d'Huttopia réside dans l'équilibre entre confort, diversité et puissance de marque.", size=21, h=0.6)
tbl = s.shapes.add_table(7, 4, Inches(0.55), Inches(1.5), Inches(12.23), Inches(4.45)).table
tbl.columns[0].width = Inches(2.7)
for i in range(1, 4): tbl.columns[i].width = Inches(3.175)
for j, hd in enumerate(["Critère", "Huttopia", "Au Diable Vert", "Les Refuges Perchés"]):
    set_cell(tbl.cell(0, j), hd, size=10.5, color=WHITE, bold=True, bg=FOREST)
comp = [
    ("Immersion dans la nature", dots(2), "forêt de 65 ha, village organisé", dots(3), "147 ha, sans véhicule", dots(3), "forêt, lac, accès à pied"),
    ("Confort des hébergements", dots(3), "chalets équipés, piscine, hôtel", dots(1), "très variable, refuges rustiques", dots(1), "rustique, autonomie"),
    ("Diversité des hébergements", dots(3), "tentes + chalets + emplacements", dots(3), "7 types de refuges insolites", dots(2), "20 refuges variés"),
    ("Originalité des activités", dots(2), "familiales, incluses, classiques", dots(3), "VéloVolant, ObservÉtoiles", dots(1), "rando, canot, baignade"),
    ("Services & restauration", dots(3), "bistro, restaurant, bar, hôtel", dots(1), "pizzas réchauffées, sur demande", dots(1), "aucun service"),
    ("Ancrage local", dots(2), "en développement (Sutton)", dots(3), "acteur historique du territoire", dots(2), "Parc Éco-Laurentides"),
]
for i, r in enumerate(comp, start=1):
    bg_i = CREAM if i % 2 else WHITE
    set_cell(tbl.cell(i, 0), r[0], size=9.5, bold=True, color=FOREST, bg=SAGE_L)
    for j, (dv, dsc) in enumerate([(r[1], r[2]), (r[3], r[4]), (r[5], r[6])]):
        txt = dv + "   " + dsc
        set_cell(tbl.cell(i, j + 1), txt, size=8.5, bg=RGBColor(0xF6, 0xEC, 0xDF) if j == 0 else bg_i,
                 bold=(j == 0))
note(s, 0.55, 6.2, 12.23,
     "●●● fort · ●● intermédiaire · ● faible. Niveaux qualitatifs issus des observations du dossier — il ne s'agit pas d'un classement. "
     "Conclusion : Huttopia n'a pas besoin de copier ses concurrents, mais peut s'inspirer de leurs meilleures pratiques pour renforcer son identité.", h=0.5)
footer(s, 15, "Partie 4 · Huttopia")

# ============================================================ S16 - TENDANCES
s = slide()
kicker(s, 0.55, 0.4, "Partie 5 · Qu'avons-nous appris sur le marché ?")
title(s, 0.55, 0.68, 12.2, "Le marché évolue vers des expériences de nature plus immersives, personnalisées et différenciantes.", size=21, h=0.6)
trends = [
    ("Diversification des hébergements insolites", "ADV : 7 types de refuges · RP : 20 cabanes · signalée comme menace concurrentielle dans le SWOT"),
    ("Recherche d'immersion et de déconnexion", "ADV : aucun véhicule, faible éclairage · RP : zéro circulation, accès à pied"),
    ("Activités originales directement sur site", "VéloVolant, ObservÉtoiles, ferme intégrée chez ADV — le client n'a pas besoin de sortir"),
    ("Expériences quatre saisons", "ADV et Côteaux Missisquoi à l'année · Sutton : patinoire hivernale et projet de buvette"),
    ("Identité territoriale & partenariats locaux", "Mont Sutton et village · Parc Éco-Laurentides · consommation locale à Frelighsburg"),
    ("Attentes de confort & de transparence", "Avis : confort variable chez ADV · à Sutton, tarifs éco sans draps/serviettes critiqués"),
]
for i, (t_title, t_ex) in enumerate(trends):
    bx = 0.55 + (i % 3) * 4.19
    by = 1.5 + (i // 3) * 2.32
    rect(s, bx, by, 3.95, 2.1, WHITE, round_=0.05, line_rgb=SAGE, line_w=1)
    num_badge(s, bx + 0.18, by + 0.16, 0.38, str(i + 1), size=11)
    tb(s, bx + 0.68, by + 0.14, 3.1, 0.75, t_title, size=9.5, color=FOREST, bold=True, line=0.95)
    tb(s, bx + 0.2, by + 1.05, 3.55, 0.95, t_ex, size=8.5, color=INK, line=1.05, italic=True)
note(s, 0.55, 6.32, 12.23,
     "Tendances observées dans le benchmark. Hypothèses à approfondir : demande hivernale réelle à Sutton, poids de la clientèle internationale, attente d'insolite côté Sutton.", h=0.42)
footer(s, 16, "Partie 5 · Marché")

# ============================================================ S17 - ENSEIGNEMENTS
s = slide()
kicker(s, 0.55, 0.4, "Partie 5 · Qu'avons-nous appris sur le marché ?")
title(s, 0.55, 0.68, 12.2, "Huttopia possède des avantages solides, mais plusieurs leviers peuvent renforcer son avantage concurrentiel.", size=21, h=0.6)
quads = [
    ("1 · VÉRITABLES AVANTAGES D'HUTTOPIA", FOREST, WHITE,
     "• Force et notoriété de la marque (internationale)\n• Équilibre nature + confort\n• Diversité des hébergements (130+ unités)\n• Offre de services structurée (restauration, piscine, animations)"),
    ("2 · ÉCARTS À TRAVAILLER", ORANGE, WHITE,
     "• Différenciation de l'expérience\n• Originalité des activités\n• Ancrage local, particulièrement à Sutton\n• Valorisation des expériences propres à chaque destination"),
    ("3 · BONNES PRATIQUES CONCURRENTES", RGBColor(0x4F, 0x7F, 0x6B), WHITE,
     "• ADV : activités originales intégrées au site\n• ADV : ferme intégrée et contact avec les animaux\n• RP : intimité et implantation des cabanes\n• Acteurs locaux : connaissance du territoire, réseau de partenaires"),
    ("4 · OPPORTUNITÉS", SAGE, INK,
     "• Développer le quatre saisons (patinoire déjà engagée à Sutton)\n• Construire des partenariats locaux\n• Proposer des activités propres à chaque destination\n• Renforcer l'expérience sans infrastructures lourdes"),
]
pos = [(0.55, 1.5), (6.65, 1.5), (0.55, 3.55), (6.65, 3.55)]
for (nm, bgc, fc, txt), (bx, by) in zip(quads, pos):
    rect(s, bx, by, 6.13, 1.88, WHITE, round_=0.05, line_rgb=SAGE, line_w=1)
    rect(s, bx, by, 6.13, 0.4, bgc, round_=0.05)
    tb(s, bx + 0.2, by + 0.07, 5.7, 0.3, nm, size=10.5, color=fc, bold=True)
    tb(s, bx + 0.25, by + 0.52, 5.72, 1.3, txt, size=9, color=INK, line=1.14)
rect(s, 0.55, 5.7, 12.23, 0.95, FOREST, round_=0.05)
tb(s, 0.85, 5.82, 1.4, 0.6, "→ CAP", size=13, color=ORANGE_L, bold=True)
tb(s, 2.0, 5.85, 10.5, 0.7,
   "Passer de « séjourner dans la nature » à « vivre une expérience unique sur un territoire ».",
   size=14, color=WHITE, bold=True, line=1.05)
footer(s, 17, "Partie 5 · Marché")

# ============================================================ S18 - 5 RECOMMANDATIONS
s = slide()
kicker(s, 0.55, 0.4, "Partie 6 · Que faut-il mettre en place ?")
title(s, 0.55, 0.68, 12.2, "Cinq leviers pour renforcer la différenciation et la valeur de l'expérience Huttopia.", size=22, h=0.6)
recs = [
    ("Développer des activités signature par destination", "La marque ne suffit plus à différencier.",
     "VéloVolant & ObservÉtoiles rendent ADV mémorable.",
     "Créer des expériences difficilement reproductibles.",
     "Un séjour unique par destination."),
    ("Renforcer l'ancrage local", "L'ancrage Sutton reste à développer.",
     "Acteurs historiques : réseaux établis, produits locaux (Frelighsburg).",
     "Partenariats producteurs, artisans, prestataires d'activités.",
     "Une expérience territoriale difficile à imiter."),
    ("Expériences immersives pour les familles", "61 % de familles à Sutton — cœur de cible.",
     "Contact animal très recherché (vaches ADV, mini-ferme, zoo).",
     "Mini-ferme pédagogique, découvertes faune/flore, participatif.",
     "Une promesse familiale renforcée."),
    ("Différencier chaque hébergement", "Vétusté et confort variable signalés dans les avis.",
     "Intimité et implantation des cabanes chez RP / ADV.",
     "Soigner intimité, implantation, extérieurs, expérience associée.",
     "De la valeur perçue à chaque nuitée."),
    ("Développer l'offre quatre saisons", "Forte saisonnalité — Sutton ferme le 12 octobre.",
     "ADV et Côteaux Missisquoi à l'année ; patinoire engagée à Sutton.",
     "Activités hivernales et services dédiés (buvette en projet).",
     "Lissage de la saisonnalité."),
]
x = 0.55; colw = 2.35; gap = 0.14
for i, (t, constat, preuve, action, benef) in enumerate(recs):
    rect(s, x, 1.5, colw, 5.2, WHITE, round_=0.05, line_rgb=SAGE, line_w=1)
    rect(s, x, 1.5, colw, 1.0, FOREST, round_=0.05)
    tb(s, x + 0.15, 1.53, 0.8, 0.45, str(i + 1), size=19, color=ORANGE_L, bold=True)
    tb(s, x + 0.15, 1.95, colw - 0.3, 0.95, t, size=9.5, color=WHITE, bold=True, line=0.95)
    yy = 2.62
    for lab, val, col, it in [("CONSTAT", constat, GREY, True), ("PREUVE", preuve, INK, False),
                              ("ACTION", action, ORANGE, False), ("BÉNÉFICE", benef, FOREST, False)]:
        tb(s, x + 0.15, yy, colw - 0.3, 0.22, lab, size=7, color=col, bold=True)
        tb(s, x + 0.15, yy + 0.19, colw - 0.3, 0.78, val, size=8,
           color=INK if lab == "ACTION" else col, bold=(lab == "ACTION"), italic=it, line=0.98)
        yy += 1.02
    x += colw + gap
note(s, 0.55, 6.85, 12.23, "Constats et preuves issus du benchmark ; projets détaillés dans le dossier (mini-ferme, concept Trappeur Aventure, navettes, paniers de producteurs locaux, hébergements flottants).", h=0.34)
footer(s, 18, "Partie 6 · Recommandations")

# ============================================================ S19 - PRIORISATION
s = slide()
kicker(s, 0.55, 0.4, "Partie 6 · Que faut-il mettre en place ?")
title(s, 0.55, 0.68, 12.2, "Les actions doivent être hiérarchisées selon leur impact et leur complexité de mise en œuvre.", size=21, h=0.6)
mx0, my0, mw, mh = 1.0, 1.75, 7.0, 4.5
rect(s, mx0, my0, mw, mh, WHITE, round_=0.03, line_rgb=SAGE, line_w=1)
q1 = rect(s, mx0 + mw / 2, my0, mw / 2, mh, SAGE_L, alpha=0.35)
tb(s, mx0 + 0.12, my0 + 0.08, 3.0, 0.3, "QUICK WINS", size=9, color=FOREST, bold=True)
tb(s, mx0 + mw / 2 + 0.12, my0 + 0.08, 3.2, 0.3, "PROJETS PRIORITAIRES", size=9, color=ORANGE, bold=True)
tb(s, mx0 + 0.12, my0 + mh - 0.36, 3.2, 0.3, "ACTIONS SECONDAIRES", size=9, color=GREY, bold=True)
tb(s, mx0 + mw / 2 + 0.12, my0 + mh - 0.36, 3.4, 0.3, "PROJETS STRUCTURANTS", size=9, color=FOREST, bold=True)
line_seg(s, mx0, my0 + mh, mx0 + mw, my0 + mh, color=GREY, w=1.5)
line_seg(s, mx0, my0, mx0, my0 + mh, color=GREY, w=1.5)
tb(s, mx0, my0 + mh + 0.08, mw, 0.3, "Complexité de mise en œuvre  →", size=9.5, color=GREY, align=PP_ALIGN.CENTER)
tb(s, mx0 - 0.75, my0 - 0.3, mw + 0.75, 0.3, "Impact attendu  ↑", size=9.5, color=GREY)
pts19 = [("2", 0.22, 0.55, "Ancrage local", "rd"), ("3", 0.35, 0.74, "Familles", "lu"),
         ("1", 0.74, 0.88, "Activités signature", "ur"), ("4", 0.60, 0.60, "Hébergements", "lu"),
         ("5", 0.88, 0.56, "Quatre saisons", "ur")]
for num, fx, fy, lab, side in pts19:
    px = mx0 + fx * mw; py = my0 + (1 - fy) * mh
    num_badge(s, px - 0.19, py - 0.19, 0.38, num, bg=ORANGE)
    lbx = px + 0.26 if side == "ur" or side == "lu" else px + 0.26
    if side == "rd":
        tb(s, px - 2.0, py - 0.13, 1.7, 0.3, lab, size=8.5, color=INK, bold=True, align=PP_ALIGN.RIGHT)
    else:
        tb(s, px + 0.26, py - 0.13, 1.8, 0.45, lab, size=8.5, color=INK, bold=True, line=0.9)
rows19 = [
    ("1 · Activités signature", "moyen", "moyen terme", "Expérience unique par destination"),
    ("2 · Ancrage local", "faible à moyen", "court terme", "Réseau territorial, partenaires"),
    ("3 · Familles", "faible à moyen", "court terme", "Cœur de cible valorisé"),
    ("4 · Hébergements", "moyen à élevé", "moyen terme", "Valeur perçue par nuitée"),
    ("5 · Quatre saisons", "élevé", "long terme", "Lissage de la saisonnalité"),
]
rect(s, 8.35, 1.75, 4.43, 4.5, WHITE, round_=0.04, line_rgb=SAGE, line_w=1)
tb(s, 8.58, 1.88, 4.0, 0.3, "LIRE LES PASTILLES", size=10, color=FOREST, bold=True)
yy = 2.28
for nm, inv, dl, ben in rows19:
    num_badge(s, 8.58, yy, 0.3, nm[0], bg=ORANGE, size=10)
    tb(s, 8.98, yy - 0.03, 3.7, 0.3, nm, size=9, color=INK, bold=True)
    tb(s, 8.98, yy + 0.24, 3.75, 0.55, "Investissement : " + inv + " · Délai : " + dl + "\nBénéfice : " + ben,
       size=7.5, color=GREY, line=0.95)
    yy += 0.8
note(s, 0.55, 6.55, 12.23,
     "Investissements : estimations qualitatives (faible / moyen / élevé) à confirmer par Huttopia — aucun budget chiffré dans cette présentation.", h=0.36)
footer(s, 19, "Partie 6 · Recommandations")

# ============================================================ S20 - CONCLUSION
s = slide(FOREST)
s.shapes.add_picture(IM["conclusion"], 0, 0, Inches(W), Inches(H))
rect(s, 0, 0, W, H, FOREST_D, alpha=0.62)
rect(s, 0, 0, 0.18, H, ORANGE)
tb(s, 0.8, 0.7, 8, 0.35, "CONCLUSION · PROPOSITION D'AMBITION", size=11, color=ORANGE_L, bold=True)
tb(s, 0.8, 1.15, 11.9, 1.6,
   "L'enjeu n'est pas de faire plus, mais de proposer\nune expérience que les concurrents ne peuvent pas reproduire.",
   size=26, color=WHITE, bold=True, line=1.08)
les = [
    "Huttopia dispose d'un avantage concurrentiel grâce à sa marque et à son positionnement nature + confort.",
    "Les concurrents démontrent qu'une expérience originale, immersive et ancrée dans le territoire devient un facteur de différenciation.",
    "Huttopia peut renforcer son modèle en développant des expériences spécifiques à chaque destination, sans perdre son identité.",
]
yy = 2.95
for i, t in enumerate(les):
    tb(s, 0.85, yy, 0.7, 0.45, f"0{i+1}", size=17, color=ORANGE_L, bold=True)
    tb(s, 1.6, yy + 0.04, 10.6, 0.6, t, size=12, color=WHITE, line=1.05)
    yy += 0.72
rect(s, 0.8, 5.45, 11.73, 1.0, WHITE, alpha=0.93, round_=0.08)
tb(s, 1.05, 5.5, 0.9, 0.8, "«", size=30, color=ORANGE, bold=True)
tb(s, 1.85, 5.62, 10.4, 0.75,
   "Ne pas seulement proposer un hébergement au cœur de la nature, mais donner à chaque destination une raison unique d'y séjourner.",
   size=13, color=FOREST, bold=True, italic=True, line=1.05)
tb(s, 0.8, 6.72, 11.7, 0.4,
   "Prochaine étape : traduire les cinq leviers en feuilles de route par destination — gains attendus à confirmer par Huttopia.",
   size=10.5, color=CREAM, italic=True)
tb(s, 12.35, 7.08, 0.45, 0.3, "20 / 20", size=8, color=CREAM, align=PP_ALIGN.RIGHT)

prs.save("/workspace/deck/Etude_concurrentielle_Huttopia_Quebec.pptx")
print("saved", len(prs.slides._sldIdLst))
