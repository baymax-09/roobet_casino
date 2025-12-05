import React from 'react'
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
  Button,
  Link,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import ReactJson from 'react-json-view'

import {
  type UserDocument,
  type DocumentStatus,
  DocumentStatusLabels,
} from 'common/types'
import { api } from 'common/util'
import { env } from 'common/constants'
import { useAxiosPost, useConfirm, useToasts } from 'common/hooks'
import { isObjectError } from 'admin/util/error'
import { useDarkMode } from 'admin/context'
import { useAccessControl } from 'admin/hooks'
import { withRulesAccessController } from 'admin/components'
import { FileUpload } from 'admin/components/FileUpload'

import { KYCPDFView } from '../KYCPDFView/KYCPDFView'
import { formatDate, documentTypes } from '../helpers'
import {
  type KYCGetForUserResponse,
  type KYCLevelWithDocuments,
} from '../types'
import { ManualVerificationToggle } from '../KYCToggles'

import { useKYCLevelDocumentListStyles } from './KYCLevelDocumentList.styles'
interface KYCLevelDocumentsProps {
  level: KYCLevelWithDocuments
  data: KYCGetForUserResponse
  title: string
  reloadKYC: () => void
}

interface LevelDocumentsListProps {
  data: KYCLevelDocumentsProps['data']
  level: KYCLevelWithDocuments
  statuses: DocumentStatus[]
  reloadKYC: () => void
}

interface UserDocumentViewProps {
  doc: KYCGetForUserResponse['documents'][number]
  reloadKYC: () => void
}

interface DocStatusProps {
  doc: KYCGetForUserResponse['documents'][number]
}

const LEVEL_DOC_TYPE_MAP: Record<
  KYCLevelWithDocuments,
  (type: string) => boolean
> = {
  2: type => {
    // We removed Veriff support, but keeping this for backward compat.
    return type === 'identity' || type.startsWith('veriff-idv')
  },
  3: type => {
    // We removed Veriff support, but keeping this for backward compat.
    return type === 'address' || type.startsWith('veriff-poa')
  },
  4: type => {
    return type === 'sof'
  },
}

const filterDocuments = (
  docs: UserDocument[],
  level: KYCLevelWithDocuments,
  statuses: DocumentStatus[],
) => {
  return docs.filter(doc => {
    if (!LEVEL_DOC_TYPE_MAP[level](doc.type)) {
      return false
    }

    if (
      statuses.includes('rejected') &&
      (doc.status === 'rejected' || doc.deleted)
    ) {
      return true
    } else {
      for (const statusFilter of statuses) {
        if (doc.status === statusFilter && !doc.deleted) {
          return true
        }
      }
    }

    return false
  })
}

const StatusSelector = withRulesAccessController(['kyc:update'], Select)
const DeleteButtonActions = withRulesAccessController(['kyc:delete'], Button)
const ManualVerificationActions = withRulesAccessController(
  ['kyc:update'],
  ManualVerificationToggle,
)

const DocStatus: React.FC<DocStatusProps> = ({ doc }) => {
  return (
    <>
      <Typography>Uploaded: {formatDate(doc.createdAt)}</Typography>
      {doc.status === 'approved' && (
        <Typography>
          Approved: {formatDate(doc.reviewedAt ?? doc.updatedAt)}{' '}
          {doc.reviewer ? ` by ${doc.reviewer}` : ''}
        </Typography>
      )}
      {doc.status === 'rejected' && (
        <Typography>
          Rejected: {formatDate(doc.reviewedAt ?? doc.updatedAt)}{' '}
          {doc.reviewer ? ` by ${doc.reviewer}` : ''}
        </Typography>
      )}
    </>
  )
}

const handleStatusChange = async (doc, event, toast, reloadKYC) => {
  try {
    await api.post('/admin/kyc/updateUserDocumentStatus', {
      status: event.target.value,
      key: doc.key,
    })
    toast.info(
      `Documents status updated to ${DocumentStatusLabels[event.target.value]}`,
    )
    reloadKYC()
  } catch (err) {
    const message = isObjectError(err)
      ? err.message
      : 'There was an error updating the document status'
    toast.error(message)
  }
}

const UserDocumentView: React.FC<UserDocumentViewProps> = ({
  doc,
  reloadKYC,
}) => {
  const classes = useKYCLevelDocumentListStyles()
  const confirm = useConfirm()
  const { toast } = useToasts()
  const { hasAccess: hasKYCAccess } = useAccessControl(['kyc:read'])

  const [isDarkMode] = useDarkMode()

  const [_deleteDocument, { loading: deleteLoading }] = useAxiosPost(
    '/admin/kyc/deleteUserDocumentByKey',
    {
      variables: { key: doc.key },
      onCompleted: () => {
        toast.info('User document deleted.')
        reloadKYC()
      },
    },
  )

  const downloadUrl = `${env.API_URL}/admin/kyc/getUserDocumentByKey?key=${doc.key}`

  const deleteDocument = React.useCallback(async () => {
    try {
      await confirm({
        title: 'Confirm Deletion',
        message: 'This will delete the document permanently.',
      })
    } catch {
      return
    }

    _deleteDocument()
  }, [_deleteDocument, confirm])

  const loading = deleteLoading

  if (!hasKYCAccess) {
    return null
  }

  return (
    <div className={classes.document}>
      <Link
        target="_blank"
        href={downloadUrl}
        className={classes.documentPreview}
        underline="hover"
      >
        {!doc.key.includes('pdf') ? (
          <div
            className={classes.documentImage}
            style={{
              backgroundImage: `url(${downloadUrl})`,
            }}
          />
        ) : (
          <KYCPDFView documentUrl={downloadUrl} />
        )}
      </Link>
      <div className={classes.documentDetail}>
        {!doc.deleted && (
          <StatusSelector
            className={classes.documentStatusSelector}
            value={doc.status}
            onChange={event => handleStatusChange(doc, event, toast, reloadKYC)}
          >
            {Object.keys(DocumentStatusLabels).map(documentStatus => {
              return (
                <MenuItem value={documentStatus}>
                  {DocumentStatusLabels[documentStatus]}
                </MenuItem>
              )
            })}
          </StatusSelector>
        )}
        <Link
          target="_blank"
          href={downloadUrl}
          component={props => (
            <Button {...props} size="medium" variant="outlined">
              Download
            </Button>
          )}
          underline="hover"
        />
        {!doc.deleted && (
          <DeleteButtonActions
            disabled={loading}
            size="medium"
            variant="outlined"
            onClick={() => deleteDocument()}
          >
            Delete
          </DeleteButtonActions>
        )}
        <DocStatus doc={doc} />
        {doc.shuftiCallbackResponse && (
          <ReactJson
            theme={isDarkMode ? 'monokai' : undefined}
            collapsed={true}
            name="Shufti Response"
            src={doc.shuftiCallbackResponse}
          />
        )}
      </div>
    </div>
  )
}

const LevelDocumentsList: React.FC<LevelDocumentsListProps> = ({
  data,
  level,
  statuses,
  reloadKYC,
}) => {
  const classes = useKYCLevelDocumentListStyles()
  const { hasAccess: hasKYCReadAccess } = useAccessControl(['kyc:read'])
  const { hasAccess: hasKYCUpdateAccess } = useAccessControl(['kyc:update'])

  const filteredDocuments = React.useMemo(() => {
    return filterDocuments(data.documents, level, statuses)
  }, [data, level, statuses])

  if (!hasKYCReadAccess) {
    return null
  }

  return (
    <div className={classes.documentsList}>
      {hasKYCUpdateAccess &&
        filteredDocuments.length === 0 &&
        !statuses.includes('rejected') && (
          <FileUpload
            disabled={false}
            dropzoneText="Upload User Document"
            submitButtonText="Upload"
            endpoint="/admin/kyc/staffUploadDocument"
            acceptedFiles={['image/png', 'image/jpeg', '.pdf']}
            extraFormData={{
              documentType: documentTypes[level],
              userId: data.user.id,
            }}
            onCompleted={reloadKYC}
            prependFileName={documentTypes[level]}
            userId={data.user.id}
          />
        )}
      {(!hasKYCUpdateAccess || statuses.includes('rejected')) &&
        filteredDocuments.length === 0 && <em>No documents to show.</em>}
      {filteredDocuments.map(doc => (
        <UserDocumentView key={doc._id} doc={doc} reloadKYC={reloadKYC} />
      ))}
    </div>
  )
}

export const KYCLevelDocumentList: React.FC<KYCLevelDocumentsProps> = ({
  data,
  level,
  title,
  reloadKYC,
}) => {
  const classes = useKYCLevelDocumentListStyles()
  const { hasAccess: hasKYCAccess } = useAccessControl(['kyc:read'])

  const [showRejected, setShowRejected] = React.useState<boolean>(false)

  const levelData = data.kyc.levels?.[level]

  if (!levelData) {
    return null
  }

  if (!hasKYCAccess) {
    return null
  }

  return (
    <Accordion defaultExpanded>
      <AccordionSummary>
        <Typography>
          Level {level} - {title}
        </Typography>
        <Typography className={classes.levelStatus}>
          {levelData.status}
        </Typography>
        {levelData.error && <Typography>&nbsp;({levelData.error})</Typography>}
      </AccordionSummary>
      <AccordionDetails>
        <LevelDocumentsList
          data={data}
          level={level}
          reloadKYC={reloadKYC}
          statuses={
            showRejected
              ? ['rejected']
              : ['approved', 'in_review', 'escalated', 'flagged']
          }
        />
      </AccordionDetails>
      <AccordionActions>
        <ManualVerificationActions
          userId={data.user.id}
          level={level}
          checked={data.kyc.manualLevelVerification?.[level]}
          reloadKYC={reloadKYC}
          extraClassName={classes.manualVerificationToggle}
        />
        <Button
          color="secondary"
          onClick={() => setShowRejected(show => !show)}
        >
          {showRejected ? 'Back' : 'View Rejects'}
        </Button>
      </AccordionActions>
    </Accordion>
  )
}
