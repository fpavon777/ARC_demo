-- Nineteen countries, names in Spanish and English. Safe to run again: it refreshes the names.
INSERT INTO paises (codigo, idioma, nombre) VALUES
  ('ES', 'es', 'España'),        ('ES', 'en', 'Spain'),
  ('FR', 'es', 'Francia'),       ('FR', 'en', 'France'),
  ('DE', 'es', 'Alemania'),      ('DE', 'en', 'Germany'),
  ('IT', 'es', 'Italia'),        ('IT', 'en', 'Italy'),
  ('PT', 'es', 'Portugal'),      ('PT', 'en', 'Portugal'),
  ('GB', 'es', 'Reino Unido'),   ('GB', 'en', 'United Kingdom'),
  ('US', 'es', 'Estados Unidos'),('US', 'en', 'United States'),
  ('MX', 'es', 'México'),        ('MX', 'en', 'Mexico'),
  ('AR', 'es', 'Argentina'),     ('AR', 'en', 'Argentina'),
  ('BR', 'es', 'Brasil'),        ('BR', 'en', 'Brazil'),
  ('CA', 'es', 'Canadá'),        ('CA', 'en', 'Canada'),
  ('JP', 'es', 'Japón'),         ('JP', 'en', 'Japan'),
  ('CL', 'es', 'Chile'),         ('CL', 'en', 'Chile'),
  ('CO', 'es', 'Colombia'),      ('CO', 'en', 'Colombia'),
  ('PE', 'es', 'Perú'),          ('PE', 'en', 'Peru'),
  ('SE', 'es', 'Suecia'),        ('SE', 'en', 'Sweden'),
  ('NO', 'es', 'Noruega'),       ('NO', 'en', 'Norway'),
  ('GR', 'es', 'Grecia'),        ('GR', 'en', 'Greece'),
  ('AU', 'es', 'Australia'),     ('AU', 'en', 'Australia')
ON CONFLICT (codigo, idioma) DO UPDATE SET nombre = EXCLUDED.nombre;
