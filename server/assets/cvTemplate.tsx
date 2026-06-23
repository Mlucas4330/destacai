import { Document, Page, View, Text, Link, StyleSheet } from '@react-pdf/renderer'
import type { z } from 'zod'
import type { CVDataSchema } from '../shared/schemas'

type CVData = z.infer<typeof CVDataSchema>

const ACCENT = '#111111'
const TEXT = '#111111'
const MUTED = '#555555'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.55,
    paddingVertical: 36,
    paddingHorizontal: 40,
    color: TEXT,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: ACCENT,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  contact: {
    textAlign: 'center',
    fontSize: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    color: MUTED,
  },
  contactText: {
    color: MUTED,
  },
  link: {
    color: ACCENT,
    textDecoration: 'none',
  },
  sectionHeading: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: ACCENT,
    marginTop: 8,
    marginBottom: 6,
    borderBottomWidth: .5,
    borderBottomColor: ACCENT,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryLeft: {
    flex: 1,
  },
  entryOrg: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: TEXT,
  },
  entryRole: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 9,
    color: MUTED,
  },
  entryRight: {
    width: 100,
    textAlign: 'right',
    fontSize: 9,
    paddingLeft: 16,
    color: MUTED,
  },
  entryLocation: {
    fontFamily: 'Helvetica-Oblique',
  },
  bulletList: {
    marginTop: 3,
    marginBottom: 10,
    paddingLeft: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDot: {
    fontSize: 10,
    width: 10,
    color: ACCENT,
    marginTop: -1,
  },
  bulletText: {
    fontSize: 9.5,
    flex: 1,
    color: TEXT,
  },
  skillItem: {
    fontSize: 9.5,
    marginBottom: 3,
    color: TEXT,
  },
  educationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
})

interface EntryProps {
  org: string
  role: string
  location: string
  dates: string
  bullets: string[]
}

function Entry({ org, role, location, dates, bullets }: EntryProps) {
  return (
    <>
      <View style={s.entryRow}>
        <View style={s.entryLeft}>
          <Text style={s.entryOrg}>{org}</Text>
          <Text style={s.entryRole}>{role}</Text>
        </View>
        <View style={s.entryRight}>
          <Text style={s.entryLocation}>{location}</Text>
          <Text>{dates}</Text>
        </View>
      </View>
      <View style={s.bulletList}>
        {bullets.map((b, i) => (
          <View key={i} style={s.bulletRow}>
            <Text style={s.bulletDot}>•</Text>
            <Text style={s.bulletText}>{b}</Text>
          </View>
        ))}
      </View>
    </>
  )
}

interface CVTemplatePDFProps {
  data: CVData
}

function CVTemplatePDF({ data }: CVTemplatePDFProps) {
  return (
    <Document>
      <Page size='A4' style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{data.name}</Text>
          <View style={s.contact}>
            <Link src={`mailto:${data.email}`} style={s.link}>{data.email}</Link>
            <Link src={data.linkedin} style={s.link}>{data.linkedin}</Link>
            <Link src={data.github} style={s.link}>{data.github}</Link>
          </View>
        </View>

        {data.leadership.length > 0 && (
          <>
            <Text style={s.sectionHeading}>Leadership Activities</Text>
            {data.leadership.map((entry, i) => (
              <Entry key={i} {...entry} />
            ))}
          </>
        )}

        <Text style={s.sectionHeading}>Experience</Text>
        {data.experience.map((entry, i) => (
          <Entry key={i} {...entry} />
        ))}

        <Text style={s.sectionHeading}>Skills</Text>
        <Text style={s.skillItem}><Text style={s.entryOrg}>Technical: </Text>{data.skills.technical}</Text>
        <Text style={s.skillItem}><Text style={s.entryOrg}>Languages: </Text>{data.skills.languages}</Text>

        <Text style={s.sectionHeading}>Education</Text>
        {data.education.map((edu, i) => (
          <View key={i} style={s.educationRow}>
            <View style={s.entryLeft}>
              <Text style={s.entryOrg}>{edu.university}</Text>
              <Text style={s.entryRole}>{edu.degree}</Text>
            </View>
            <View style={s.entryRight}>
              <Text style={s.entryLocation}>{edu.location}</Text>
              <Text>{edu.dates}</Text>
            </View>
          </View>
        ))}
      </Page>
    </Document>
  )
}

export default CVTemplatePDF
