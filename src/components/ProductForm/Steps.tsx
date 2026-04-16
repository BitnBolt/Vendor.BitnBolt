import Image from 'next/image';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ProductFormData, ProductFormErrors } from './types';

const inp =
  'w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const lbl = 'block text-xs font-medium text-gray-600 mb-1';
const sec = 'text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100 pb-2 mb-3';

interface StepsProps {
  formData: ProductFormData;
  setFormData: (data: ProductFormData) => void;
  isEditing?: boolean;
  productId?: string;
  errors: ProductFormErrors;
  handleImageUpload?: (file: File) => Promise<void>;
  isUploading?: boolean;
}

export default function ProductFormSteps({
  formData,
  setFormData,
  isEditing,
  productId,
  errors,
  handleImageUpload: externalHandleImageUpload,
  isUploading = false,
}: StepsProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const busilyUploading = isUploading || uploadingImage;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG and WebP images are allowed');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB');
      return;
    }

    if (externalHandleImageUpload) {
      await externalHandleImageUpload(file);
      return;
    }

    try {
      setUploadingImage(true);
      const imageFormData = new FormData();
      imageFormData.append('image', file);

      if (isEditing && productId) {
        imageFormData.append('productId', productId);
        if (typeof index === 'number') {
          imageFormData.append('imageIndex', index.toString());
        }
      }

      const token = localStorage.getItem('vendorToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/vendor/products/upload-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: imageFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();

      if (typeof index === 'number') {
        const newImages = [...formData.images];
        newImages[index] = data.data.imageUrl;
        setFormData({ ...formData, images: newImages });
      } else {
        setFormData({ ...formData, images: [...formData.images, data.data.imageUrl] });
      }

      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 xl:gap-6">
        <div className="xl:col-span-8 space-y-5 min-w-0">
          <section>
            <h2 className={sec}>Basic</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className={lbl}>Product name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inp}
                  placeholder="Name"
                />
                {errors.name && <p className="mt-0.5 text-xs text-red-600">{errors.name}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={inp}
                  placeholder="Short description"
                />
                {errors.description && <p className="mt-0.5 text-xs text-red-600">{errors.description}</p>}
              </div>
              <div>
                <label className={lbl}>Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={inp}
                  placeholder="Category"
                />
                {errors.category && <p className="mt-0.5 text-xs text-red-600">{errors.category}</p>}
              </div>
              <div>
                <label className={lbl}>Sub category</label>
                <input
                  type="text"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className={inp}
                  placeholder="Optional"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Brand *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className={inp}
                  placeholder="Brand"
                />
                {errors.brand && <p className="mt-0.5 text-xs text-red-600">{errors.brand}</p>}
              </div>
            </div>
          </section>

          <section>
            <h2 className={sec}>Pricing &amp; stock</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Base price (₹) *</label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  className={inp}
                />
                {errors.basePrice && <p className="mt-0.5 text-xs text-red-600">{errors.basePrice}</p>}
              </div>
              <div>
                <label className={lbl}>Stock *</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) })}
                  min="0"
                  className={inp}
                />
                {errors.stock && <p className="mt-0.5 text-xs text-red-600">{errors.stock}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className={lbl}>Min. order qty</label>
                <input
                  type="number"
                  value={formData.minimumOrderQuantity}
                  onChange={(e) =>
                    setFormData({ ...formData, minimumOrderQuantity: parseInt(e.target.value, 10) })
                  }
                  min="1"
                  className={inp}
                />
                {errors.minimumOrderQuantity && (
                  <p className="mt-0.5 text-xs text-red-600">{errors.minimumOrderQuantity}</p>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className={sec}>Details</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>What&apos;s in the box *</label>
                {formData.whatsInTheBox.map((item, index) => (
                  <div key={index} className="flex gap-1.5 mb-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...formData.whatsInTheBox];
                        newItems[index] = e.target.value;
                        setFormData({ ...formData, whatsInTheBox: newItems });
                      }}
                      className={inp}
                      placeholder="Item"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = formData.whatsInTheBox.filter((_, i) => i !== index);
                        setFormData({ ...formData, whatsInTheBox: newItems.length ? newItems : [''] });
                      }}
                      className="shrink-0 px-2 text-red-600 hover:bg-red-50 rounded-md text-lg leading-none"
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, whatsInTheBox: [...formData.whatsInTheBox, ''] })}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  + Add item
                </button>
                {errors.whatsInTheBox && <p className="mt-0.5 text-xs text-red-600">{errors.whatsInTheBox}</p>}
              </div>

              <div>
                <label className={lbl}>About this item *</label>
                {formData.aboutItem.map((item, index) => (
                  <div key={index} className="flex gap-1.5 mb-1.5">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newItems = [...formData.aboutItem];
                        newItems[index] = e.target.value;
                        setFormData({ ...formData, aboutItem: newItems });
                      }}
                      className={inp}
                      placeholder="Detail"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = formData.aboutItem.filter((_, i) => i !== index);
                        setFormData({ ...formData, aboutItem: newItems.length ? newItems : [''] });
                      }}
                      className="shrink-0 px-2 text-red-600 hover:bg-red-50 rounded-md text-lg leading-none"
                      aria-label="Remove detail"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, aboutItem: [...formData.aboutItem, ''] })}
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  + Add detail
                </button>
                {errors.aboutItem && <p className="mt-0.5 text-xs text-red-600">{errors.aboutItem}</p>}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Features</label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 mb-1.5">
                    <input
                      type="text"
                      value={feature.key}
                      onChange={(e) => {
                        const newFeatures = [...formData.features];
                        newFeatures[index] = { ...feature, key: e.target.value };
                        setFormData({ ...formData, features: newFeatures });
                      }}
                      className={inp}
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={feature.value}
                      onChange={(e) => {
                        const newFeatures = [...formData.features];
                        newFeatures[index] = { ...feature, value: e.target.value };
                        setFormData({ ...formData, features: newFeatures });
                      }}
                      className={inp}
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFeatures = formData.features.filter((_, i) => i !== index);
                        setFormData({
                          ...formData,
                          features: newFeatures.length ? newFeatures : [{ key: '', value: '' }],
                        });
                      }}
                      className="px-2 text-red-600 hover:bg-red-50 rounded-md"
                      aria-label="Remove feature"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, features: [...formData.features, { key: '', value: '' }] })
                  }
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  + Add feature
                </button>
              </div>

              <div>
                <label className={lbl}>Specifications</label>
                {formData.specifications.map((spec, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 mb-1.5">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => {
                        const newSpecs = [...formData.specifications];
                        newSpecs[index] = { ...spec, key: e.target.value };
                        setFormData({ ...formData, specifications: newSpecs });
                      }}
                      className={inp}
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => {
                        const newSpecs = [...formData.specifications];
                        newSpecs[index] = { ...spec, value: e.target.value };
                        setFormData({ ...formData, specifications: newSpecs });
                      }}
                      className={inp}
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSpecs = formData.specifications.filter((_, i) => i !== index);
                        setFormData({
                          ...formData,
                          specifications: newSpecs.length ? newSpecs : [{ key: '', value: '' }],
                        });
                      }}
                      className="px-2 text-red-600 hover:bg-red-50 rounded-md"
                      aria-label="Remove specification"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      specifications: [...formData.specifications, { key: '', value: '' }],
                    })
                  }
                  className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                >
                  + Add specification
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className={lbl}>Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        const newTags = formData.tags.filter((_, i) => i !== index);
                        setFormData({ ...formData, tags: newTags });
                      }}
                      className="text-indigo-600 hover:text-indigo-900 font-bold leading-none"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type tag, press Enter"
                className={inp}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    setFormData({
                      ...formData,
                      tags: [...formData.tags, e.currentTarget.value.trim()],
                    });
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </section>

          <section>
            <h2 className={sec}>Shipping &amp; policies</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div>
                <label className={lbl}>Weight (g) *</label>
                <input
                  type="number"
                  value={formData.shippingInfo.weight}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingInfo: {
                        ...formData.shippingInfo,
                        weight: parseFloat(e.target.value),
                      },
                    })
                  }
                  min="0"
                  step="0.01"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>L (cm)</label>
                <input
                  type="number"
                  value={formData.shippingInfo.dimensions.length}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingInfo: {
                        ...formData.shippingInfo,
                        dimensions: {
                          ...formData.shippingInfo.dimensions,
                          length: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  min="0"
                  step="0.1"
                  placeholder="—"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>W (cm)</label>
                <input
                  type="number"
                  value={formData.shippingInfo.dimensions.width}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingInfo: {
                        ...formData.shippingInfo,
                        dimensions: {
                          ...formData.shippingInfo.dimensions,
                          width: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  min="0"
                  step="0.1"
                  placeholder="—"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>H (cm)</label>
                <input
                  type="number"
                  value={formData.shippingInfo.dimensions.height}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shippingInfo: {
                        ...formData.shippingInfo,
                        dimensions: {
                          ...formData.shippingInfo.dimensions,
                          height: parseFloat(e.target.value),
                        },
                      },
                    })
                  }
                  min="0"
                  step="0.1"
                  placeholder="—"
                  className={inp}
                />
              </div>
            </div>
            {errors.shippingInfo && <p className="mb-3 text-xs text-red-600">{errors.shippingInfo}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isReturnable"
                    checked={formData.returnPolicy.isReturnable}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        returnPolicy: {
                          ...formData.returnPolicy,
                          isReturnable: e.target.checked,
                        },
                      })
                    }
                    className="h-3.5 w-3.5 text-indigo-600 rounded border-gray-300"
                  />
                  <label htmlFor="isReturnable" className="text-sm text-gray-700">
                    Returns allowed
                  </label>
                </div>
                {formData.returnPolicy.isReturnable && (
                  <>
                    <div>
                      <label className={lbl}>Return window (days)</label>
                      <input
                        type="number"
                        value={formData.returnPolicy.returnWindow}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            returnPolicy: {
                              ...formData.returnPolicy,
                              returnWindow: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        min="1"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Return conditions</label>
                      {formData.returnPolicy.returnConditions.map((condition, index) => (
                        <div key={index} className="flex gap-1.5 mb-1.5">
                          <input
                            type="text"
                            value={condition}
                            onChange={(e) => {
                              const newConditions = [...formData.returnPolicy.returnConditions];
                              newConditions[index] = e.target.value;
                              setFormData({
                                ...formData,
                                returnPolicy: {
                                  ...formData.returnPolicy,
                                  returnConditions: newConditions,
                                },
                              });
                            }}
                            className={inp}
                            placeholder="Condition"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newConditions = formData.returnPolicy.returnConditions.filter(
                                (_, i) => i !== index,
                              );
                              setFormData({
                                ...formData,
                                returnPolicy: {
                                  ...formData.returnPolicy,
                                  returnConditions: newConditions.length ? newConditions : [''],
                                },
                              });
                            }}
                            className="px-2 text-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            returnPolicy: {
                              ...formData.returnPolicy,
                              returnConditions: [...formData.returnPolicy.returnConditions, ''],
                            },
                          })
                        }
                        className="text-xs text-indigo-600"
                      >
                        + Add condition
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isReplaceable"
                    checked={formData.replacePolicy?.isReplaceable || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        replacePolicy: {
                          ...formData.replacePolicy,
                          isReplaceable: e.target.checked,
                          replaceWindow: formData.replacePolicy?.replaceWindow || 7,
                          replaceConditions: formData.replacePolicy?.replaceConditions || [''],
                        },
                      })
                    }
                    className="h-3.5 w-3.5 text-indigo-600 rounded border-gray-300"
                  />
                  <label htmlFor="isReplaceable" className="text-sm text-gray-700">
                    Replacement allowed
                  </label>
                </div>
                {formData.replacePolicy?.isReplaceable && (
                  <>
                    <div>
                      <label className={lbl}>Replace window (days)</label>
                      <input
                        type="number"
                        value={formData.replacePolicy.replaceWindow}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            replacePolicy: {
                              ...formData.replacePolicy,
                              replaceWindow: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        min="1"
                        className={inp}
                      />
                    </div>
                    <div>
                      <label className={lbl}>Replace conditions</label>
                      {formData.replacePolicy.replaceConditions.map((condition, index) => (
                        <div key={index} className="flex gap-1.5 mb-1.5">
                          <input
                            type="text"
                            value={condition}
                            onChange={(e) => {
                              const newConditions = [...formData.replacePolicy.replaceConditions];
                              newConditions[index] = e.target.value;
                              setFormData({
                                ...formData,
                                replacePolicy: {
                                  ...formData.replacePolicy,
                                  replaceConditions: newConditions,
                                },
                              });
                            }}
                            className={inp}
                            placeholder="Condition"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newConditions = formData.replacePolicy.replaceConditions.filter(
                                (_, i) => i !== index,
                              );
                              setFormData({
                                ...formData,
                                replacePolicy: {
                                  ...formData.replacePolicy,
                                  replaceConditions: newConditions.length ? newConditions : [''],
                                },
                              });
                            }}
                            className="px-2 text-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            replacePolicy: {
                              ...formData.replacePolicy,
                              replaceConditions: [
                                ...(formData.replacePolicy.replaceConditions || []),
                                '',
                              ],
                            },
                          })
                        }
                        className="text-xs text-indigo-600"
                      >
                        + Add condition
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="xl:col-span-4 space-y-3 min-w-0">
          <section className="xl:sticky xl:top-4 border border-gray-100 rounded-lg p-3 bg-gray-50/50">
            <h2 className={sec}>Images *</h2>
            <p className="text-[11px] text-gray-500 mb-2">JPEG / PNG / WebP, max 5MB. First image is the cover.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-2 gap-2">
              {formData.images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-gray-200 bg-white">
                  <Image
                    src={image}
                    alt={`Product ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 33vw, 160px"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newImages = formData.images.filter((_, i) => i !== index);
                      setFormData({ ...formData, images: newImages });
                    }}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600 shadow"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="aspect-square border border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-white bg-white transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={busilyUploading}
                  onChange={async (e) => {
                    await handleImageUpload(e);
                    e.target.value = '';
                  }}
                />
                {busilyUploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
                ) : (
                  <>
                    <span className="text-gray-400 text-lg leading-none mb-0.5">+</span>
                    <span className="text-[10px] text-gray-500 text-center px-1">Add</span>
                  </>
                )}
              </label>
            </div>
            {errors.images && <p className="mt-2 text-xs text-red-600">{errors.images}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
