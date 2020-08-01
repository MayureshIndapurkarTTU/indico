// This file is part of Indico.
// Copyright (C) 2002 - 2020 CERN
//
// Indico is free software; you can redistribute it and/or
// modify it under the terms of the MIT License; see the
// LICENSE file for more details.

import uploadBOAFileURL from 'indico-url:abstracts.upload_boa_file';
import customBOAURL from 'indico-url:abstracts.manage_custom_boa';

import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import {Form as FinalForm} from 'react-final-form';
import {Form, Modal, Button} from 'semantic-ui-react';
import {FinalSubmitButton, handleSubmitError} from 'indico/react/forms';
import {Translate} from 'indico/react/i18n';
import {FinalSingleFileManager} from 'indico/react/components';
import {indicoAxios, handleAxiosError} from 'indico/utils/axios';
import {fileDetailsShape} from 'indico/react/components/files/props';

export default function CustomBOAModal({eventId, initialFile, hasLatex}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const deleteExistingBOA = async () => {
    setDeleting(true);
    try {
      await indicoAxios.delete(customBOAURL({confId: eventId}));
    } catch (e) {
      handleAxiosError(e);
      setDeleting(false);
      return;
    }
    location.reload();
  };

  const handleSubmit = async ({file}) => {
    try {
      await indicoAxios.post(customBOAURL({confId: eventId}), {file});
    } catch (e) {
      return handleSubmitError(e);
    }
    location.reload();
    // never finish submitting to avoid fields being re-enabled
    await new Promise(() => {});
  };

  let buttonLabel;
  if (hasLatex) {
    buttonLabel = initialFile
      ? Translate.string('Manage custom PDF')
      : Translate.string('Upload custom PDF');
  } else {
    buttonLabel = initialFile ? Translate.string('Manage PDF') : Translate.string('Upload PDF');
  }

  return (
    <>
      <span
        className={`i-button ${initialFile ? 'icon-file-pdf' : 'icon-arrow-up'}`}
        style={{marginRight: '0.3rem'}}
        onClick={() => setModalOpen(true)}
      >
        {buttonLabel}
      </span>
      {modalOpen && (
        <FinalForm
          onSubmit={handleSubmit}
          initialValues={{file: initialFile ? initialFile.uuid : null}}
          subscription={{submitting: true}}
        >
          {fprops => (
            <Modal
              open
              onClose={() => setModalOpen(false)}
              size="small"
              closeIcon={!fprops.submitting}
              closeOnEscape={!fprops.submitting}
              closeOnDimmerClick={!fprops.submitting}
            >
              <Modal.Header
                content={
                  hasLatex
                    ? Translate.string('Manage custom Book of Abstracts')
                    : Translate.string('Manage Book of Abstracts')
                }
              />
              <Modal.Content>
                <Form onSubmit={fprops.handleSubmit} id="custom-boa-form">
                  <div style={{marginBottom: '20px', textAlign: 'center'}}>
                    <FinalSingleFileManager
                      name="file"
                      validExtensions={['pdf']}
                      initialFileDetails={initialFile}
                      uploadURL={uploadBOAFileURL({confId: eventId})}
                      required
                      hideValidationError
                    />
                  </div>
                  <div className="description" style={{margin: '10px'}}>
                    {hasLatex ? (
                      <Translate>
                        You can upload a custom PDF for your Book of Abstracts. Please note that
                        this overrides the autogenerated file. To switch back to the default book of
                        abstracts you'll have to delete the custom file.
                      </Translate>
                    ) : (
                      <Translate>
                        You can upload a PDF file with the Book of Abstracts here.
                      </Translate>
                    )}
                  </div>
                </Form>
              </Modal.Content>
              <Modal.Actions style={{display: 'flex', justifyContent: 'flex-end'}}>
                {initialFile !== null && (
                  <Button
                    style={{marginRight: 'auto'}}
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={fprops.submitting}
                    negative
                  >
                    {hasLatex ? (
                      <Translate>Delete custom PDF</Translate>
                    ) : (
                      <Translate>Delete current PDF</Translate>
                    )}
                  </Button>
                )}
                <Button onClick={() => setModalOpen(false)} disabled={fprops.submitting}>
                  <Translate>Cancel</Translate>
                </Button>
                <FinalSubmitButton form="custom-boa-form" label={Translate.string('Upload BoA')} />
              </Modal.Actions>
            </Modal>
          )}
        </FinalForm>
      )}
      <Modal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        size="tiny"
        closeOnDimmerClick={false}
      >
        <Modal.Header content={Translate.string('Confirm deletion')} />
        <Modal.Content>
          {hasLatex ? (
            <Translate>
              Do you really want to delete the custom Book of Abstracts? This will revert to the
              default auto-generated one.
            </Translate>
          ) : (
            <Translate>
              Do you really want to delete the Book of Abstracts? This will disable the Book of
              Abstracts until you upload a new one.
            </Translate>
          )}
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={deleting}>
            <Translate>Cancel</Translate>
          </Button>
          <Button negative onClick={deleteExistingBOA} disabled={deleting} loading={deleting}>
            <Translate>Delete</Translate>
          </Button>
        </Modal.Actions>
      </Modal>
    </>
  );
}

CustomBOAModal.propTypes = {
  eventId: PropTypes.number.isRequired,
  hasLatex: PropTypes.bool.isRequired,
  initialFile: fileDetailsShape,
};

CustomBOAModal.defaultProps = {
  initialFile: null,
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('#boa-custom-upload');
  if (!container) {
    return;
  }
  const eventId = parseInt(container.dataset.eventId, 10);
  const customFile = JSON.parse(container.dataset.file);
  const hasLatex = 'hasLatex' in container.dataset;
  ReactDOM.render(
    <CustomBOAModal eventId={eventId} initialFile={customFile} hasLatex={hasLatex} />,
    container
  );
});
